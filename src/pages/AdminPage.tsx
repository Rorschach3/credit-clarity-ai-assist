
import { useEffect, useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Package, Mail } from "lucide-react"
import { DisputeManagement } from "@/components/admin/DisputeManagement"
import { UserManagement } from "@/components/admin/UserManagement"

interface Dispute {
  id: string
  credit_bureau: string
  mailing_address: string
  status: string
  letter_content: string
  shipping_label_url: string | null
  tracking_number: string | null
  created_at: string
  user_id: string
}

interface User {
  id: string
  email: string
  subscription_tier?: string
  active?: boolean
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
    setIsLoading(true)
    const { data, error } = await supabase
      .from(Tables.disputes)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch disputes",
        variant: "destructive",
      })
    } else {
      setDisputes(data || [])
    }
    setIsLoading(false)
  }

  async function fetchUsers() {
    setIsLoading(true)
    // Get users from auth.users via RPC or other secure method
    // For this example, we'll use the subscribers table which contains user info
    const { data, error } = await supabase
      .from(Tables.subscribers)
      .select('user_id, email, subscription_tier, subscribed')

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } else {
      setUsers(data?.map(sub => ({
        id: sub.user_id || '',
        email: sub.email || '',
        subscription_tier: sub.subscription_tier,
        active: sub.subscribed
      })) || [])
    }
    setIsLoading(false)
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
