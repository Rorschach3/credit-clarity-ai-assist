
import { useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  subscription_tier?: string
  active?: boolean
}

interface UserManagementProps {
  isLoading: boolean
  users: User[]
  fetchUsers: () => Promise<void>
}

export function UserManagement({ isLoading, users, fetchUsers }: UserManagementProps) {
  const { toast } = useToast()

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
                    <TableCell>{user.subscription_tier || 'None'}</TableCell>
                    <TableCell>
                      {user.active ? (
                        <Badge className="bg-green-500 text-white">Active</Badge>
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
  )
}
