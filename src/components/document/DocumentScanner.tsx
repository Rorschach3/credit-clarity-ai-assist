
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth"; // Fixed import path
import { FileUploadZone } from "./FileUploadZone";
import { ScanStatus } from "./ScanStatus";
import { SubscriptionPrompt } from "./SubscriptionPrompt";
import type { NegativeItem } from "@/types/document";

interface DocumentScannerProps {
  onScanComplete: (negativeItems: NegativeItem[]) => void;
}

export function DocumentScanner({ onScanComplete }: DocumentScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [subscription, setSubscription] = useState<{subscribed: boolean; subscription_tier?: string}>();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { url } } = await supabase.functions.invoke('check-subscription');
      if (!url) {
        console.error('No URL returned from check-subscription function');
        return;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const subData = await response.json();
      console.log('Subscription data:', subData);
      setSubscription(subData);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Subscription Check Failed",
        description: "Unable to verify your subscription status. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleSubscribe = async () => {
    try {
      const { data: { url } } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_H5ggYwtDq4fbrJ' },
      });
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Could not initiate subscription process. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleScan = async () => {
    if (!file || !subscription?.subscribed || !user) {
      toast({
        title: "Error",
        description: !subscription?.subscribed 
          ? "You need a subscription to scan documents" 
          : "Please upload a file first",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setScanStatus('scanning');

    try {
      const userId = user.id;
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      
      console.log('Uploading file to:', filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from('credit_reports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', data?.path);

      // Simulate document analysis with mock data
      setTimeout(() => {
        const mockNegativeItems: NegativeItem[] = [
          {
            id: "1",
            creditorName: "ABC Collections",
            accountNumber: "XXXX-1234",
            amount: "$1,245",
            dateReported: "2024-03-15",
            bureaus: ["Experian", "TransUnion"],
            reason: "Collection Account",
            status: "Open"
          },
          {
            id: "2",
            creditorName: "XYZ Financial",
            accountNumber: "XXXX-5678",
            amount: "$567",
            dateReported: "2024-02-20",
            bureaus: ["Equifax", "Experian"],
            reason: "Late Payment",
            status: "Open"
          },
          {
            id: "3",
            creditorName: "Credit Card Company",
            accountNumber: "XXXX-9012",
            amount: "$3,500",
            dateReported: "2024-01-10",
            bureaus: ["TransUnion", "Equifax"],
            reason: "Charge-off",
            status: "Open"
          }
        ];

        setScanStatus('complete');
        setIsScanning(false);
        onScanComplete(mockNegativeItems);
        
        toast({
          title: "Analysis Complete",
          description: `Found ${mockNegativeItems.length} negative items on your credit report.`,
        });
      }, 3000);
    } catch (error) {
      console.error("Error scanning document:", error);
      setScanStatus('error');
      setIsScanning(false);
      toast({
        title: "Scan Failed",
        description: "There was an error analyzing your document. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!subscription?.subscribed) {
    return <SubscriptionPrompt onSubscribe={handleSubscribe} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Credit Report</CardTitle>
        <CardDescription>
          Upload your credit report to scan for negative items that can be disputed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUploadZone file={file} onFileChange={setFile} />
        
        <ScanStatus status={scanStatus} />

        {file && scanStatus !== 'scanning' && (
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleScan}
              size="sm"
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                "Scan Document"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
