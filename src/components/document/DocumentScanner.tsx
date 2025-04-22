
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Check, AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App"; // Import the auth context

interface DocumentScannerProps {
  onScanComplete: (negativeItems: NegativeItem[]) => void;
}

export interface NegativeItem {
  id: string;
  creditorName: string;
  accountNumber: string;
  amount: string;
  dateReported: string;
  bureaus: string[];
  reason: string;
  status: string;
}

export function DocumentScanner({ onScanComplete }: DocumentScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [subscription, setSubscription] = useState<{subscribed: boolean; subscription_tier?: string}>();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current authenticated user

  // Check subscription status when component mounts or user changes
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
        body: { priceId: 'price_H5ggYwtDq4fbrJ' }, // Replace with your actual price ID
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const selectedFile = e.target.files[0];
    
    // Check if file is a PDF
    if (selectedFile.type !== 'application/pdf' && 
        !selectedFile.type.includes('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file.",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    setScanStatus('idle');

    // Check subscription status
    if (user) {
      await checkSubscription();
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
      // Upload file to Supabase Storage in credit_reports bucket
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

      // Simulate document analysis with mock data for now
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
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            Upload and analyze your credit reports with our AI-powered system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">
            Subscribe to access our AI-powered credit report analysis
          </p>
          <Button onClick={handleSubscribe}>
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    );
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
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
          {!file ? (
            <>
              <FileText className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">
                Drag and drop your credit report PDF or click to browse
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="mt-4">
                <Button variant="outline" className="cursor-pointer">
                  Select File
                </Button>
              </label>
            </>
          ) : (
            <div className="w-full text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-primary mr-2" />
                <span className="font-medium">{file.name}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {Math.round(file.size / 1024)} KB
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Change
                </Button>
                {scanStatus !== 'scanning' && (
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
                )}
              </div>
            </div>
          )}
        </div>
        
        {scanStatus === 'scanning' && (
          <div className="mt-4 p-4 bg-primary-foreground rounded-lg">
            <div className="flex items-center mb-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
              <p className="text-sm font-medium">Analyzing document...</p>
            </div>
            <p className="text-xs text-gray-500">
              Our AI is scanning your document for negative items that can be disputed.
              This may take a moment.
            </p>
          </div>
        )}
        
        {scanStatus === 'complete' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center mb-1">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm font-medium text-green-800">Analysis complete!</p>
            </div>
            <p className="text-xs text-green-700">
              Negative items identified. Scroll down to review them and generate disputes.
            </p>
          </div>
        )}
        
        {scanStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center mb-1">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm font-medium text-red-800">Analysis failed</p>
            </div>
            <p className="text-xs text-red-700">
              There was an error analyzing your document. Please try again or upload a different file.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
