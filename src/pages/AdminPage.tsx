
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

interface Dispute {
  id: string
  credit_bureau: string
  mailing_address: string
  status: string
  letter_content: string
  shipping_label_url: string | null
  tracking_number: string | null
  created_at: string
}

export default function AdminPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() {
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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Portal - Dispute Management</h1>
      
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
            {disputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell>{dispute.credit_bureau}</TableCell>
                <TableCell>{dispute.mailing_address}</TableCell>
                <TableCell>{dispute.status}</TableCell>
                <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {!dispute.shipping_label_url ? (
                    <Button
                      onClick={() => generateShippingLabel(dispute)}
                      size="sm"
                    >
                      Generate Label
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        as="a"
                        href={dispute.shipping_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="outline"
                      >
                        View Label
                      </Button>
                      {dispute.tracking_number && (
                        <div className="text-sm text-muted-foreground">
                          Tracking: {dispute.tracking_number}
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
