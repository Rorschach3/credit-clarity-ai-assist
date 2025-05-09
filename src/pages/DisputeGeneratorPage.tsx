
import { useState } from "react";
import { FileText, Bot, UserCircle, FileArchive, FileCheck, MailOpen } from "lucide-react";
import { ProgressIndicator } from "@/components/disputes/ProgressIndicator";
import { StepIndicator } from "@/components/disputes/StepIndicator";
import { StepManager } from "@/components/disputes/StepManager";

type Step = 'personal' | 'scan' | 'select' | 'documents' | 'generate' | 'complete';

export default function DisputeGeneratorPage() {
  const [step, setStep] = useState<Step>('personal');
  const [personalInfo, setPersonalInfo] = useState<any>(null);

  // Define steps for the StepIndicator
  const steps = [
    { id: 'personal', title: 'Personal Info', description: 'Your details', icon: <UserCircle className="h-5 w-5" /> },
    { id: 'scan', title: 'Add Data', description: 'Upload or enter', icon: <FileText className="h-5 w-5" /> },
    { id: 'select', title: 'Select Items', description: 'Choose accounts', icon: <Bot className="h-5 w-5" /> },
    { id: 'documents', title: 'Identity Docs', description: 'Upload ID & SSN', icon: <FileArchive className="h-5 w-5" /> },
    { id: 'generate', title: 'Letters', description: 'Review & save', icon: <FileCheck className="h-5 w-5" /> },
    { id: 'complete', title: 'Complete', description: 'Finished', icon: <MailOpen className="h-5 w-5" /> },
  ];

  const stepIds = steps.map(step => step.id);
  
  const resetProcess = () => {
    setStep('personal');
  };

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
        <StepManager
          steps={steps}
          onStepChange={setStep}
          onReset={resetProcess}
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
        />
      </div>
    </div>
  );
}
