
import { useState } from "react";
import { EnhancedDocumentScanner } from "@/components/document/EnhancedDocumentScanner";
import { type NegativeItem } from "@/types/document";
import { EnhancedNegativeItemsList } from "@/components/disputes/EnhancedNegativeItemsList";
import { EnhancedDisputeLetterGenerator } from "@/components/disputes/EnhancedDisputeLetterGenerator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, FileCheck, MailOpen, Plus, Upload, UserCircle, FileArchive, AlertCircle } from "lucide-react";
import { DisputeAnalysis } from "@/utils/ai-service";
import { ManualDisputeForm } from "@/components/disputes/ManualDisputeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoForm } from "@/components/disputes/PersonalInfoForm";
import { UserDocumentsSection } from "@/components/disputes/UserDocumentsSection";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DisputeGeneratorPage() {
  const [step, setStep] = useState<'personal' | 'scan' | 'select' | 'documents' | 'generate' | 'complete'>('personal');
  const [negativeItems, setNegativeItems] = useState<NegativeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<NegativeItem[]>([]);
  const [disputeAnalysis, setDisputeAnalysis] = useState<DisputeAnalysis | null>(null);
  const [entryMethod, setEntryMethod] = useState<'scan' | 'manual'>('scan');
  const [personalInfo, setPersonalInfo] = useState<any>(null);
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
    setStep('documents');
  };

  const handleDocumentsComplete = () => {
    setStep('generate');
  };

  const handleDisputesComplete = () => {
    setStep('complete');
    toast({
      title: "Disputes Saved",
      description: "Your AI-generated dispute letters have been created and saved successfully.",
    });
  };

  const handleManualItemCreated = (newItem: NegativeItem) => {
    setNegativeItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item Added",
      description: "Dispute item has been added successfully.",
    });
    
    if (step === 'scan') {
      setStep('select');
    }
  };

  // Fix: Change this function to accept the info parameter and store it
  const handlePersonalInfoComplete = (info: any) => {
    setPersonalInfo(info);
    setStep('scan');
  };

  const resetProcess = () => {
    setStep('personal');
    setNegativeItems([]);
    setSelectedItems([]);
    setDisputeAnalysis(null);
  };

  const skipDocumentsStep = () => {
    toast({
      title: "Documents Skipped",
      description: "You've chosen to skip the identity document submission step.",
    });
    setStep('generate');
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const steps = ['personal', 'scan', 'select', 'documents', 'generate', 'complete'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex) / (steps.length - 1)) * 100;
  };

  // Helper function to get the step icon
  const getStepIcon = (currentStep: string, thisStep: string) => {
    if (currentStep === thisStep) {
      return <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">{
        thisStep === 'personal' ? <UserCircle className="h-5 w-5" /> :
        thisStep === 'scan' ? <FileText className="h-5 w-5" /> :
        thisStep === 'select' ? <Bot className="h-5 w-5" /> :
        thisStep === 'documents' ? <FileArchive className="h-5 w-5" /> :
        thisStep === 'generate' ? <FileCheck className="h-5 w-5" /> :
        <MailOpen className="h-5 w-5" />
      }</div>;
    }
    return <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">{
      thisStep === 'personal' ? <UserCircle className="h-5 w-5" /> :
      thisStep === 'scan' ? <FileText className="h-5 w-5" /> :
      thisStep === 'select' ? <Bot className="h-5 w-5" /> :
      thisStep === 'documents' ? <FileArchive className="h-5 w-5" /> :
      thisStep === 'generate' ? <FileCheck className="h-5 w-5" /> :
      <MailOpen className="h-5 w-5" />
    }</div>;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">AI-Powered Credit Report Dispute Assistant</h1>
      <p className="text-muted-foreground mb-4">
        Upload your credit report or manually enter account details, our AI will help generate customized dispute letters
      </p>
      
      {/* Progress indicator */}
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm text-muted-foreground">{Math.round(getProgressPercentage())}%</span>
      </div>
      <Progress value={getProgressPercentage()} className="mb-8" />
      
      <div className="flex items-center justify-center mb-10 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'personal')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'personal' ? 'text-primary' : ''}`}>Personal Info</p>
            <p className="text-xs text-muted-foreground">Your details</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'scan')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'scan' ? 'text-primary' : ''}`}>Add Data</p>
            <p className="text-xs text-muted-foreground">Upload or enter</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'select')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'select' ? 'text-primary' : ''}`}>Select Items</p>
            <p className="text-xs text-muted-foreground">Choose accounts</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'documents')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'documents' ? 'text-primary' : ''}`}>Identity Docs</p>
            <p className="text-xs text-muted-foreground">Upload ID & SSN</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'generate')}
          <div className="ml-2 mr-6">
            <p className={`font-medium ${step === 'generate' ? 'text-primary' : ''}`}>Letters</p>
            <p className="text-xs text-muted-foreground">Review & save</p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-muted"></div>
        <div className="flex items-center min-w-max">
          {getStepIcon(step, 'complete')}
          <div className="ml-2">
            <p className={`font-medium ${step === 'complete' ? 'text-primary' : ''}`}>Complete</p>
            <p className="text-xs text-muted-foreground">Finished</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {step === 'personal' && (
          <PersonalInfoForm onComplete={handlePersonalInfoComplete} />
        )}
        
        {step === 'scan' && (
          <Tabs defaultValue={entryMethod} onValueChange={(value) => setEntryMethod(value as 'scan' | 'manual')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Credit Report
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>
            <TabsContent value="scan">
              <EnhancedDocumentScanner onScanComplete={handleScanComplete} />
            </TabsContent>
            <TabsContent value="manual">
              <ManualDisputeForm onItemCreated={handleManualItemCreated} />
            </TabsContent>
          </Tabs>
        )}
        
        {step === 'select' && (
          <>
            <Tabs defaultValue={entryMethod} onValueChange={(value) => setEntryMethod(value as 'scan' | 'manual')} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="scan" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Credit Report
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>
              <TabsContent value="scan">
                <EnhancedDocumentScanner onScanComplete={handleScanComplete} />
              </TabsContent>
              <TabsContent value="manual">
                <ManualDisputeForm onItemCreated={handleManualItemCreated} />
              </TabsContent>
            </Tabs>
            
            <EnhancedNegativeItemsList 
              items={negativeItems} 
              analysis={disputeAnalysis}
              onGenerateDisputes={handleGenerateDisputes} 
            />
          </>
        )}
        
        {step === 'documents' && (
          <>
            <UserDocumentsSection onComplete={handleDocumentsComplete} />
            
            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                Documents help verify your identity with credit bureaus, but you can continue without them if needed.
                <div className="mt-4">
                  <Button 
                    variant="outline"
                    onClick={skipDocumentsStep}
                    className="bg-white hover:bg-blue-50"
                  >
                    Skip Documents & Continue to Letters
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </>
        )}
        
        {step === 'generate' && (
          <>
            <EnhancedDisputeLetterGenerator 
              items={selectedItems}
              onComplete={handleDisputesComplete}
              personalInfo={personalInfo}
            />
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('documents')}
              >
                Back to Documents
              </Button>
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
