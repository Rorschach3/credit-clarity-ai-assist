
import { useState } from "react";
import { EnhancedDocumentScanner } from "@/components/document/EnhancedDocumentScanner";
import { type NegativeItem } from "@/types/document";
import { EnhancedNegativeItemsList } from "@/components/disputes/EnhancedNegativeItemsList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Bot, UserCircle, FileArchive, FileCheck, MailOpen } from "lucide-react";
import { DisputeAnalysis } from "@/utils/ai-service";
import { ManualDisputeForm } from "@/components/disputes/ManualDisputeForm";
import { PersonalInfoForm } from "@/components/disputes/PersonalInfoForm";
import { UserDocumentsSection } from "@/components/disputes/UserDocumentsSection";
import { ProgressIndicator } from "@/components/disputes/ProgressIndicator";
import { StepIndicator } from "@/components/disputes/StepIndicator";
import { CompletionStep } from "@/components/disputes/CompletionStep";
import { InputMethodTabs } from "@/components/disputes/InputMethodTabs";
import { SkipDocumentsAlert } from "@/components/disputes/SkipDocumentsAlert";
import { GenerateLettersSection } from "@/components/disputes/GenerateLettersSection";

export default function DisputeGeneratorPage() {
  const [step, setStep] = useState<'personal' | 'scan' | 'select' | 'documents' | 'generate' | 'complete'>('personal');
  const [negativeItems, setNegativeItems] = useState<NegativeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<NegativeItem[]>([]);
  const [disputeAnalysis, setDisputeAnalysis] = useState<DisputeAnalysis | null>(null);
  const [entryMethod, setEntryMethod] = useState<'scan' | 'manual'>('scan');
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const { toast } = useToast();

  // Define steps for the StepIndicator
  const steps = [
    { id: 'personal', title: 'Personal Info', description: 'Your details', icon: <UserCircle className="h-5 w-5" /> },
    { id: 'scan', title: 'Add Data', description: 'Upload or enter', icon: <FileText className="h-5 w-5" /> },
    { id: 'select', title: 'Select Items', description: 'Choose accounts', icon: <Bot className="h-5 w-5" /> },
    { id: 'documents', title: 'Identity Docs', description: 'Upload ID & SSN', icon: <FileArchive className="h-5 w-5" /> },
    { id: 'generate', title: 'Letters', description: 'Review & save', icon: <FileCheck className="h-5 w-5" /> },
    { id: 'complete', title: 'Complete', description: 'Finished', icon: <MailOpen className="h-5 w-5" /> },
  ];

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

  const stepIds = steps.map(step => step.id);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">AI-Powered Credit Report Dispute Assistant</h1>
      <p className="text-muted-foreground mb-4">
        Upload your credit report or manually enter account details, our AI will help generate customized dispute letters
      </p>
      
      {/* Progress indicator */}
      <ProgressIndicator currentStep={step} steps={stepIds} />
      
      {/* Step indicator */}
      <StepIndicator currentStep={step} steps={steps} />
      
      <div className="grid grid-cols-1 gap-8">
        {step === 'personal' && (
          <PersonalInfoForm onComplete={handlePersonalInfoComplete} />
        )}
        
        {step === 'scan' && (
          <InputMethodTabs
            entryMethod={entryMethod}
            onMethodChange={(value) => setEntryMethod(value)}
            scanContent={<EnhancedDocumentScanner onScanComplete={handleScanComplete} />}
            manualContent={<ManualDisputeForm onItemCreated={handleManualItemCreated} />}
          />
        )}
        
        {step === 'select' && (
          <>
            <InputMethodTabs
              entryMethod={entryMethod}
              onMethodChange={(value) => setEntryMethod(value)}
              scanContent={<EnhancedDocumentScanner onScanComplete={handleScanComplete} />}
              manualContent={<ManualDisputeForm onItemCreated={handleManualItemCreated} />}
            />
            
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
            <SkipDocumentsAlert onSkip={skipDocumentsStep} />
          </>
        )}
        
        {step === 'generate' && (
          <GenerateLettersSection
            selectedItems={selectedItems}
            personalInfo={personalInfo}
            onComplete={handleDisputesComplete}
            onBackToDocuments={() => setStep('documents')}
            onBackToItems={() => setStep('select')}
          />
        )}
        
        {step === 'complete' && <CompletionStep onRestart={resetProcess} />}
      </div>
    </div>
  );
}
