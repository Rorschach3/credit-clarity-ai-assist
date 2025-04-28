
import { useEffect, useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Package, Printer, Mail } from "lucide-react"

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
      .from('disputes')
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
      .from('subscribers')
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
        subscription: sub.subscription_tier,
        active: sub.subscribed
      })) || [])
    }
    setIsLoading(false)
  }

  async function generateShippingLabel(dispute: Dispute) {
    try {
      const response = await supabase.functions.invoke('generate-shipping-label', {
        body: {
          disputeId: dispute.id,
          toAddress: {
            name: dispute.credit_bureau,
            street1: dispute.mailing_address.split('\n')[0],
            city: dispute.mailing_address.split('\n')[1].split(',')[0],
            state: dispute.mailing_address.split('\n')[1].split(',')[1].trim().split(' ')[0],
            zip: dispute.mailing_address.split('\n')[1].split(',')[1].trim().split(' ')[1],
            country: 'US'
          }
        }
      })

      if (response.error) throw new Error(response.error)

      // Update dispute with shipping label URL and tracking number
      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          shipping_label_url: response.data.labelUrl,
          tracking_number: response.data.trackingNumber,
          status: 'label_generated'
        })
        .eq('id', dispute.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Shipping label generated successfully",
      })

      // Refresh disputes list
      fetchDisputes()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function markDisputeAsSent(dispute: Dispute) {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'sent'
        })
        .eq('id', dispute.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Dispute marked as sent",
      })

      // Refresh disputes list
      fetchDisputes()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update dispute status",
        variant: "destructive",
      })
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'label_generated':
        return <Badge variant="secondary">Label Generated</Badge>
      case 'sent':
        return <Badge variant="success" className="bg-green-500 text-white">Sent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  async function grantAdminAccess(userId: string) {
    try {
      // Check if user already has an entry in user_roles
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()

      if (!existingRole) {
        // Add user to admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Admin access granted",
        })
      } else {
        toast({
          title: "Info",
          description: "User already has admin access",
        })
      }

      // Refresh users list
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant admin access",
        variant: "destructive",
      })
    }
  }

  async function revokeAdminAccess(userId: string) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin')

      if (error) throw error

      toast({
        title: "Success",
        description: "Admin access revoked",
      })

      // Refresh users list
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke admin access",
        variant: "destructive",
      })
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
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>View and manage customer dispute letters and shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Credit Bureau</TableHead>
                      <TableHead>Mailing Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading disputes...</TableCell>
                      </TableRow>
                    ) : disputes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">No disputes found</TableCell>
                      </TableRow>
                    ) : (
                      disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell>{dispute.credit_bureau}</TableCell>
                          <TableCell>{dispute.mailing_address}</TableCell>
                          <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                          <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {dispute.status === 'pending' ? (
                              <Button
                                onClick={() => generateShippingLabel(dispute)}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                Generate Label
                              </Button>
                            ) : dispute.status === 'label_generated' ? (
                              <div className="space-y-2">
                                <a
                                  href={dispute.shipping_label_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                                >
                                  <Printer className="h-4 w-4" /> View Label
                                </a>
                                {dispute.tracking_number && (
                                  <div className="text-sm text-muted-foreground">
                                    Tracking: {dispute.tracking_number}
                                  </div>
                                )}
                                <Button
                                  onClick={() => markDisputeAsSent(dispute)}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                >
                                  Mark as Sent
                                </Button>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {dispute.tracking_number && (
                                  <div>Tracking: {dispute.tracking_number}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users and subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">Loading users...</TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">No users found</TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.subscription || 'None'}</TableCell>
                          <TableCell>
                            {user.active ? (
                              <Badge variant="success" className="bg-green-500 text-white">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={() => grantAdminAccess(user.id)}
                                size="sm"
                                variant="outline"
                              >
                                Grant Admin
                              </Button>
                              <Button
                                onClick={() => revokeAdminAccess(user.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Revoke Admin
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
