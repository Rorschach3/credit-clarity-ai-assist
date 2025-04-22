
import { useState } from "react";
import { DocumentScanner, type NegativeItem } from "@/components/document/DocumentScanner";
import { NegativeItemsList } from "@/components/disputes/NegativeItemsList";
import { DisputeLetterGenerator } from "@/components/disputes/DisputeLetterGenerator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DisputeGeneratorPage() {
  const [step, setStep] = useState<'scan' | 'select' | 'generate' | 'complete'>('scan');
  const [negativeItems, setNegativeItems] = useState<NegativeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<NegativeItem[]>([]);
  const { toast } = useToast();

  const handleScanComplete = (items: NegativeItem[]) => {
    setNegativeItems(items);
    if (items.length > 0) {
      setStep('select');
    } else {
      toast({
        title: "No negative items found",
        description: "We couldn't identify any negative items on your credit report. Upload a different report or try again.",
      });
    }
  };

  const handleGenerateDisputes = (items: NegativeItem[]) => {
    setSelectedItems(items);
    setStep('generate');
  };

  const handleDisputesComplete = () => {
    setStep('complete');
    toast({
      title: "Disputes Saved",
      description: "Your dispute letters have been created and saved successfully.",
    });
  };

  const resetProcess = () => {
    setStep('scan');
    setNegativeItems([]);
    setSelectedItems([]);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Credit Report Dispute Assistant</h1>
      <p className="text-muted-foreground mb-8">
        Upload your credit report, identify negative items, and generate customized dispute letters
      </p>
      
      <div className="grid grid-cols-1 gap-8">
        {step === 'scan' && (
          <DocumentScanner onScanComplete={handleScanComplete} />
        )}
        
        {step === 'select' && (
          <>
            <DocumentScanner onScanComplete={handleScanComplete} />
            <NegativeItemsList 
              items={negativeItems} 
              onGenerateDisputes={handleGenerateDisputes} 
            />
          </>
        )}
        
        {step === 'generate' && (
          <>
            <DisputeLetterGenerator 
              items={selectedItems}
              onComplete={handleDisputesComplete}
            />
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('select')}
              >
                Back to Item Selection
              </Button>
            </div>
          </>
        )}
        
        {step === 'complete' && (
          <div className="text-center py-12 space-y-6">
            <h2 className="text-2xl font-bold">Dispute Process Complete!</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your dispute letters have been created and saved. You can access them from your dashboard
              to print, download, or mail them directly to the credit bureaus.
            </p>
            <div className="pt-4">
              <Button onClick={resetProcess}>
                Start New Dispute
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
