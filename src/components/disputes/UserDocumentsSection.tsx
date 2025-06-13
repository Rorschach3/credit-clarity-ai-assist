// components/UserDocumentsSection.tsx
'use client';
import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUploader } from "./DocumentUploader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserDocumentsStatus } from "@/hooks/useUserDocumentsStatus";

interface UserDocumentsSectionProps {
  onComplete?: () => void;
}

export const UserDocumentsSection = ({ onComplete }: UserDocumentsSectionProps) => {
  const { user } = useAuth();
  const userId = user?.id;
  const { status, fetchStatus } = useUserDocumentsStatus(userId);

  const allUploaded = useMemo(
    () => Object.values(status).every((v) => v),
    [status]
  );

  const handleDocumentUpload = useCallback(() => {
    fetchStatus();
    if (allUploaded && onComplete) {
      onComplete();
    }
  }, [fetchStatus, allUploaded, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Required Identity Documents</CardTitle>
        <CardDescription>
          Credit bureaus require these documents to process your dispute. All documents must be clear, legible, and unedited.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Why are these documents needed?</AlertTitle>
          <AlertDescription>
            Credit bureaus require these documents to verify your identity before processing any dispute. Without them, bureaus will typically reject your dispute request.
          </AlertDescription>
        </Alert>

        {allUploaded && (
          <Alert variant="default" className="bg-green-50 text-green-700 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>All Required Documents Uploaded</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span>You&#39;ve successfully uploaded all required identity documents.</span>
              <Button onClick={handleSkip} className="bg-green-600 hover:bg-green-700">
                Continue to Letter Generation <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentUploader
            documentType="photo_id"
            title="Government-Issued Photo ID"
            description="Upload a clear photo of your driver&#39;s license, passport, or state ID"
            acceptedFileTypes="image/jpeg,image/png,image/jpg,.pdf"
            onUploadComplete={handleDocumentUpload}
          />

          <DocumentUploader
            documentType="ssn_card"
            title="Social Security Card"
            description="Upload a clear photo of your Social Security card"
            acceptedFileTypes="image/jpeg,image/png,image/jpg,.pdf"
            onUploadComplete={handleDocumentUpload}
          />

          <DocumentUploader
            documentType="utility_bill"
            title="Utility Bill or Proof of Address"
            description="Upload a recent utility bill, bank statement, or other document showing your current address"
            acceptedFileTypes="image/jpeg,image/png,image/jpg,.pdf"
            onUploadComplete={handleDocumentUpload}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleSkip} className="w-full">
            Skip Document Upload & Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Note: Skipping may reduce your chances of a successful dispute with credit bureaus.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
