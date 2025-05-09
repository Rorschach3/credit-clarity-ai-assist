
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/schema";
import { Loader2 } from "lucide-react";

interface NegativeItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DisputeItem {
  id: string;
  bureau: string;
  company: string;
  type: string;
  amount: string;
  status: string;
}

export function NegativeItemsDialog({ open, onOpenChange }: NegativeItemsDialogProps) {
  const [items, setItems] = useState<DisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchDisputeItems();
    }
  }, [open]);

  async function fetchDisputeItems() {
    setIsLoading(true);
    try {
      // Try to fetch real data from Supabase
      const { data, error } = await supabase
        .from(Tables.disputes)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching disputes:", error);
        // Fall back to sample data if no real data available
        setItems(getSampleDisputeItems());
      } else if (data && data.length > 0) {
        // Map Supabase data to our display format
        const mappedItems = data.map(dispute => ({
          id: dispute.id,
          bureau: dispute.credit_bureau,
          company: extractCompanyName(dispute.letter_content),
          type: "Collection Account",
          amount: "$0", // Would need to be extracted from letter_content or added to schema
          status: dispute.status
        }));
        setItems(mappedItems);
      } else {
        // No data found, use sample data
        setItems(getSampleDisputeItems());
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setItems(getSampleDisputeItems());
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to extract company name from letter content
  function extractCompanyName(content: string): string {
    try {
      // Basic extraction - would need to be improved based on actual letter format
      if (!content) return "Unknown Company";
      const matches = content.match(/regarding.*?account with\s+(.*?)(?:\.|,|\s+on)/i);
      return matches && matches[1] ? matches[1] : "Credit Account";
    } catch {
      return "Credit Account";
    }
  }

  // Sample data as fallback
  function getSampleDisputeItems(): DisputeItem[] {
    return [
      {
        id: "1",
        bureau: "Experian",
        company: "Collection Agency A",
        type: "Collection Account",
        amount: "$1,245",
        status: "Pending"
      },
      {
        id: "2",
        bureau: "TransUnion",
        company: "Bank XYZ",
        type: "Late Payment",
        amount: "$89",
        status: "Disputed"
      },
      {
        id: "3",
        bureau: "Equifax",
        company: "Credit Card Company",
        type: "Charge-off",
        amount: "$3,500",
        status: "Verified"
      },
      {
        id: "4",
        bureau: "Experian",
        company: "Collection Agency B",
        type: "Collection Account",
        amount: "$567",
        status: "Removed"
      }
    ];
  }

  // Helper function to determine badge color based on status
  function getStatusBadgeVariant(status: string) {
    switch (status.toLowerCase()) {
      case 'removed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'disputed':
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'verified':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Negative Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No negative items found.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{item.company}</h4>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeVariant(item.status)}
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bureau:</span> {item.bureau}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span> {item.type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span> {item.amount}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
