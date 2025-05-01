import { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Dispute, Tables } from "@/integrations/supabase/schema"
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
import { Printer } from "lucide-react"

interface DisputeManagementProps {
  isLoading: boolean
  disputes: Dispute[]
  fetchDisputes: () => Promise<void>
}

export function DisputeManagement({ isLoading, disputes, fetchDisputes }: DisputeManagementProps) {
  const { toast } = useToast()

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

      if (response.error) throw new Error(response.error.message)

      // Update dispute with shipping label URL and tracking number
      const { error: updateError } = await supabase
        .from(Tables.disputes)
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
    } catch (error: any) {
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
        .from(Tables.disputes)
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
        return <Badge className="bg-green-500 text-white">Sent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
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
  )
}
