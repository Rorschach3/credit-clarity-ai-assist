
import { useEffect, useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Tables, Dispute } from "@/integrations/supabase/schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Package, Mail } from "lucide-react"
import { DisputeManagement } from "@/components/admin/DisputeManagement"
import { UserManagement } from "@/components/admin/UserManagement"

interface User {
  id: string
  email: string
  subscription_tier?: string
  active?: boolean
  is_admin?: boolean
}

export default function AdminPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('disputes')

  useEffect(() => {
    if (activeTab === 'disputes') {
      fetchDisputes()
    } else if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  async function fetchDisputes() {
    console.log("Fetching disputes...")
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from(Tables.disputes)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching disputes:", error)
        toast({
          title: "Error",
          description: `Failed to fetch disputes: ${error.message}`,
          variant: "destructive",
        })
      } else {
        console.log("Disputes fetched:", data)
        setDisputes(data || [])
      }
    } catch (e) {
      console.error("Exception in fetchDisputes:", e)
      toast({
        title: "Error",
        description: "An unexpected error occurred when fetching disputes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsers() {
    console.log("Fetching users...")
    setIsLoading(true)
    try {
      // First fetch subscribers to get user info
      const { data: subscribersData, error: subscribersError } = await supabase
        .from(Tables.subscribers)
        .select('user_id, email, subscription_tier, subscribed')

      if (subscribersError) {
        console.error("Error fetching subscribers:", subscribersError)
        toast({
          title: "Error",
          description: `Failed to fetch users: ${subscribersError.message}`,
          variant: "destructive",
        })
        setUsers([])
        return
      }

      console.log("Subscribers data:", subscribersData)
      
      // Convert subscribers to user format
      const usersFromSubscribers = subscribersData.map(sub => ({
        id: sub.user_id || '',
        email: sub.email || '',
        subscription_tier: sub.subscription_tier,
        active: sub.subscribed
      })) || []

      // Now let's check which users are admins
      if (usersFromSubscribers.length > 0) {
        // Fetch admin roles for these users
        const { data: rolesData, error: rolesError } = await supabase
          .from(Tables.user_roles)
          .select('user_id, role')
          .eq('role', 'admin')

        if (rolesError) {
          console.error("Error fetching roles:", rolesError)
        } else {
          console.log("Roles data:", rolesData)
          
          // Create a map of user_id to admin status
          const adminMap = new Map()
          if (rolesData) {
            rolesData.forEach(role => {
              adminMap.set(role.user_id, true)
            })
          }

          // Update users with admin status
          const usersWithAdminStatus = usersFromSubscribers.map(user => ({
            ...user,
            is_admin: adminMap.has(user.id)
          }))

          setUsers(usersWithAdminStatus)
        }
      } else {
        setUsers(usersFromSubscribers)
      }
    } catch (e) {
      console.error("Exception in fetchUsers:", e)
      toast({
        title: "Error",
        description: "An unexpected error occurred when fetching users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Admin Portal</h1>
      </div>
      
      <Tabs defaultValue="disputes" className="mb-8" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Disputes
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Users & Subscriptions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="disputes">
          <DisputeManagement 
            isLoading={isLoading} 
            disputes={disputes} 
            fetchDisputes={fetchDisputes}
          />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement 
            isLoading={isLoading} 
            users={users} 
            fetchUsers={fetchUsers}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
