
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Send, Loader2 } from "lucide-react";
import { type Bureau } from "@/utils/bureau-constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/App";

interface DisputeLetterPreviewProps {
  letterContent: string;
  bureau?: Bureau;
}

export function DisputeLetterPreview({ letterContent, bureau }: DisputeLetterPreviewProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const handleDownload = () => {
    // Create a blob from the text content
    const blob = new Blob([letterContent], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `dispute-letter-${bureau || 'all'}-${new Date().toISOString().split('T')[0]}.txt`;
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Simulate a click on the link
    link.click();
    
    // Remove the link from the document
    document.body.removeChild(link);
    
    // Clean up the URL created for the blob
    URL.revokeObjectURL(url);
    
    toast.success("Dispute letter downloaded successfully");
  };

  const handleSend = async () => {
    if (!user) {
      toast.error("You need to be logged in to send dispute letters");
      return;
    }

    if (!bureau) {
      toast.error("No credit bureau specified");
      return;
    }

    try {
      setIsLoading('send');

      // First check if the user has an active subscription
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      
      if (subError) throw new Error(subError.message);
      
      if (!subData?.subscribed) {
        toast.error("You need an active subscription to send dispute letters");
        return;
      }

      // TODO: In a real implementation, we would send this to the backend to process
      // and mail the physical letter
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Dispute letter to ${bureau} has been queued for sending`);
      
    } catch (error) {
      console.error('Error sending dispute letter:', error);
      toast.error("Could not send dispute letter. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div>
      <div className="bg-muted p-6 rounded-md mb-4 whitespace-pre-wrap font-mono text-sm">
        {letterContent}
      </div>
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
          disabled={isLoading !== null}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSend}
          disabled={isLoading !== null}
        >
          {isLoading === 'send' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
