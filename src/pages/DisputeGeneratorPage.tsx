
import { useState } from "react";
import { EnhancedDocumentScanner } from "@/components/document/EnhancedDocumentScanner";
import { type NegativeItem } from "@/types/document";
import { EnhancedNegativeItemsList } from "@/components/disputes/EnhancedNegativeItemsList";
import { EnhancedDisputeLetterGenerator } from "@/components/disputes/EnhancedDisputeLetterGenerator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, FileCheck, MailOpen } from "lucide-react";
import { DisputeAnalysis } from "@/utils/ai-service";

export default function DisputeGeneratorPage() {
  const [step, setStep] = useState<'scan' | 'select' | 'generate' | 'complete'>('scan');
  const [negativeItems, setNegativeItems] = useState<NegativeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<NegativeItem[]>([]);
  const [disputeAnalysis, setDisputeAnalysis] = useState<DisputeAnalysis | null>(null);
  const { toast } = useToast();

  const handleScanComplete = (items: NegativeItem[], analysis?: DisputeAnalysis) => {
    setNegativeItems(items);
    if (analysis) {
      setDisputeAnalysis(analysis);
    }
    
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
      description: "Your AI-generated dispute letters have been created and saved successfully.",
    });
  };

  const resetProcess = () => {
    setStep('scan');
    setNegativeItems([]);
    setSelectedItems([]);
    setDisputeAnalysis(null);
  };

  // Helper function to get the step icon
  const getStepIcon = (currentStep: string, thisStep: string) => {
    if (currentStep === thisStep) {
      return <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">{
        thisStep === 'scan' ? <FileText className="h-5 w-5" /> :
        thisStep === 'select' ? <Bot className="h-5 w-5" /> :
        thisStep === 'generate' ? <FileCheck className="h-5 w-5" /> :
        <MailOpen className="h-5 w-5" />
      }</div>;
    }
    return <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">{
      thisStep === 'scan' ? <FileText className="h-5 w-5" /> :
      thisStep === 'select' ? <Bot className="h-5 w-5" /> :
      thisStep === 'generate' ? <FileCheck className="h-5 w-5" /> :
      <MailOpen className="h-5 w-5" />
    }</div>;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">AI-Powered Credit Report Dispute Assistant</h1>
      <p className="text-muted-foreground mb-8">
        Upload your credit report, our AI will identify negative items and generate customized dispute letters
      </p>
      
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center">
          {getStepIcon(step, 'scan')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'scan' ? 'text-primary' : ''}`}>Scan Report</p>
            <p className="text-xs text-muted-foreground">Upload & analyze</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center">
          {getStepIcon(step, 'select')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'select' ? 'text-primary' : ''}`}>Select Items</p>
            <p className="text-xs text-muted-foreground">Choose accounts to dispute</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center">
          {getStepIcon(step, 'generate')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'generate' ? 'text-primary' : ''}`}>Generate Letters</p>
            <p className="text-xs text-muted-foreground">Review & save</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center">
          {getStepIcon(step, 'complete')}
          <div className="ml-2">
            <p className={`font-medium ${step === 'complete' ? 'text-primary' : ''}`}>Complete</p>
            <p className="text-xs text-muted-foreground">Process finished</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {step === 'scan' && (
          <EnhancedDocumentScanner onScanComplete={handleScanComplete} />
        )}
        
        {step === 'select' && (
          <>
            <EnhancedDocumentScanner onScanComplete={handleScanComplete} />
            <EnhancedNegativeItemsList 
              items={negativeItems} 
              analysis={disputeAnalysis}
              onGenerateDisputes={handleGenerateDisputes} 
            />
          </>
        )}
        
        {step === 'generate' && (
          <>
            <EnhancedDisputeLetterGenerator 
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold">AI-Powered Dispute Process Complete!</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your AI-optimized dispute letters have been created and saved. You can access them from your dashboard
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

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
