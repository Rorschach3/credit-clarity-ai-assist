"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "@/components/ui/use-toast";
import { DocumentUploadSection } from "@/components/disputes/DocumentUploadSection";
import { MailingInstructions } from "@/components/disputes/MailingInstructions";

const DisputePacketPage: React.FC = () => {
  const [showDocsSection, setShowDocsSection] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGeneratePacket = async () => {
    setGenerating(true);
    try {
      // Add logic here to bundle documents, letters, and any PDFs
      toast({
        title: "Packet Generated",
        description: "Dispute packet generated successfully!",
      });
    } catch (error) {
      console.error("Error generating packet:", error);
      toast({
        title: "Generation Failed",
        description: "There was a problem generating your packet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
        <Card className="max-w-6xl mx-auto space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Step 3: Generate Dispute Packet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>Would you like to add your identity documents to this dispute?</p>

            {!showDocsSection && (
              <Button onClick={() => setShowDocsSection(true)}>
                Add Identity Documents
              </Button>
            )}

            {showDocsSection && (
              <DocumentUploadSection onClose={() => setShowDocsSection(false)} />
            )}

            <MailingInstructions />

            <Button onClick={handleGeneratePacket} disabled={generating}>
              {generating ? "Generating..." : "Generate Dispute Packet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DisputePacketPage;
