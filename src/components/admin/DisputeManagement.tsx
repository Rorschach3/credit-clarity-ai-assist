import { useState, useEffect } from 'react'
import { differenceInCalendarDays, addBusinessDays } from 'date-fns'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { Database, Tables } from "@/integrations/supabase/schema";
import useActivityMonitoring from "@/hooks/use-activity-monitoring";
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
import { Printer, Loader2, FileText, TruckIcon } from "lucide-react"
import RealTimeQueue from "./RealTimeQueue"

interface DisputeManagementProps {
  isLoading: boolean
  disputes: Tables<'public'>['disputes']['Row'][]
  fetchDisputes: () => Promise<void>
  setDisputes: React.Dispatch<React.SetStateAction<Tables<'public'>['disputes']['Row'][]>>
}

export function DisputeManagement({ isLoading, disputes, fetchDisputes }: DisputeManagementProps) {
  const { toast } = useToast()
  const [processingDisputes, setProcessingDisputes] = useState<{ [key: string]: boolean }>({})
  useActivityMonitoring("Viewed Dispute Management")

  async function generateShippingLabel(dispute: Tables<'public'>['disputes']['Row']) {
    try {
      setProcessingDisputes(prev => ({ ...prev, [dispute.id]: true }))
      console.log("Generating shipping label for dispute:", dispute)

      if (!dispute.mailing_address) {
        throw new Error("Dispute has no mailing address")
      }

      const addressLines = dispute.mailing_address.split('\n')
      const cityStateZip = addressLines.length > 1 ? addressLines[1].split(',') : ['', '']
      const city = cityStateZip[0].trim()
      const stateZip = cityStateZip[1].trim().split(' ')
      const state = stateZip[0]
      const zip = stateZip.length > 1 ? stateZip[1] : ''

      const response = await supabase.functions.invoke('generate-shipping-label', {
        body: {
          disputeId: dispute.id,
          toAddress: {
            name: dispute.credit_bureau,
            street1: addressLines[0],
            city: city,
            state: state,
            zip: zip,
            country: 'US'
          }
        }
      })

      if (response.error) {
        console.error("Error from generate-shipping-label function:", response.error)
        throw new Error(response.error.message)
      }

      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          shipping_label_url: response.data.labelUrl,
          tracking_number: response.data.trackingNumber,
          status: 'label_generated'
        })
        .eq('id', dispute.id)

      if (updateError) {
        console.error("Error updating dispute with shipping info:", updateError)
        throw updateError
      }

      toast({
        title: "Success",
        description: "Shipping label generated successfully",
      })

      fetchDisputes()
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in generateShippingLabel:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to generate shipping label",
          variant: "destructive",
        })
      }
    } finally {
      setProcessingDisputes(prev => ({ ...prev, [dispute.id]: false }))
    }
  }

  async function markDisputeAsSent(dispute: Tables<'public'>['disputes']['Row']) {
    try {
      setProcessingDisputes(prev => ({ ...prev, [dispute.id]: true }))

      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'sent'
        })
        .eq('id', dispute.id)

      if (error) {
        console.error("Error updating dispute status:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "Dispute marked as sent",
      })

      fetchDisputes()
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in markDisputeAsSent:", error)
        toast({
          title: "Error",
          description: `Failed to update dispute status: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setProcessingDisputes(prev => ({ ...prev, [dispute.id]: false }))
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><FileText className="h-3 w-3" /> Pending</Badge>
      case 'label_generated':
        return <Badge variant="secondary" className="flex items-center gap-1"><Printer className="h-3 w-3" /> Label Generated</Badge>
      case 'sent':
        return <Badge className="bg-green-500 text-white flex items-center gap-1"><TruckIcon className="h-3 w-3" /> Sent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const [escalationThreshold] = useState(35) // Escalate if no response in 35 days

  useEffect(() => {
    const checkDeadlines = async () => {
      const nearingDeadline = disputes.filter(dispute =>
        differenceInCalendarDays(new Date(dispute.created_at), new Date()) >= 40
      )
      
      if (nearingDeadline.length > 0) {
        await supabase
          .from('audit_history')
          .insert(nearingDeadline.map(dispute => ({
            dispute_id: dispute.id,
            action: 'deadline_warning',
            details: `FCRA §611 response deadline approaching`,
            created_at: new Date().toISOString()
          })))
      }
    }
    
    checkDeadlines()
    const interval = setInterval(checkDeadlines, 3600000) // Check hourly
    return () => clearInterval(interval)
  }, [disputes])

  const autoEscalateCases = async () => {
    const toEscalate = disputes.filter(dispute =>
      dispute.status === 'processing' &&
      differenceInCalendarDays(new Date(), new Date(dispute.created_at)) >= escalationThreshold
    )

    for (const dispute of toEscalate) {
      await supabase
        .from('disputes')
        .update({ status: 'escalated' })
        .eq('id', dispute.id)
      
      await supabase
        .from('audit_history')
        .insert({
          dispute_id: dispute.id,
          action: 'auto_escalation',
          details: `Escalated after ${escalationThreshold} days without resolution`,
          created_at: new Date().toISOString()
        })
    }
    
    if (toEscalate.length > 0) {
      setDisputes(prev => prev.map(d =>
        toEscalate.some(es => es.id === d.id) ? {...d, status: 'escalated'} : d
      ))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Management</CardTitle>
        <CardDescription className="flex gap-2">
          <Badge variant="outline" className="border-blue-200 text-blue-600">
            FCRA §611 Compliance
          </Badge>
          View and manage customer dispute letters and shipments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RealTimeQueue />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit Bureau</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>FCRA Violations</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading disputes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : disputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No disputes found.
                    <div className="mt-2 text-sm text-muted-foreground">
                      User-generated disputes will appear here.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                      <TableCell className="font-medium">
                        {dispute.credit_bureau}
                      </TableCell>
                      <TableCell>
                        {createdDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {dispute.fcra_violations?.split(',').map((violation) => (
                            <Badge
                              key={violation}
                              variant="destructive"
                              className="text-xs"
                            >
                              {violation}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className={
                        differenceInCalendarDays(new Date(), createdDate) > 40
                          ? 'text-red-600 font-medium'
                          : ''
                      }>
                        {deadlineDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          dispute.status === 'escalated' ? 'destructive' : 'outline'
                        }>
                          {dispute.status}
                        </Badge>
                      </TableCell>
                    <TableCell>
                      {dispute.mailing_address ? dispute.mailing_address.substring(0, 50) + '...' : 'No content'}
                    </TableCell>
                    <TableCell>
                      {'No attachments available'}
                    </TableCell>
                    <TableCell>
                      {dispute.status === 'pending' ? (
                        <Button
                          onClick={() => generateShippingLabel(dispute)}
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={processingDisputes[dispute.id]}
                        >
                          {processingDisputes[dispute.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
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
                            disabled={processingDisputes[dispute.id]}
                          >
                            {processingDisputes[dispute.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <TruckIcon className="h-4 w-4 mr-2" />
                            )}
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