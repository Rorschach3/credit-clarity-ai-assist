"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { createWorker, Worker } from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { pdfToImages } from "@/utils/pdfToImage";
import { useAuth } from "@/hooks/use-auth";
import { aiService } from "@/utils/ai-service";
import { saveTradelinesToDatabase, parseTradelinesFromText, ParsedTradeline } from "@/utils/tradelineParser";

import { MailingInstructions } from "@/components/disputes/MailingInstructions";
import { DocumentUploadSection } from "@/components/disputes/DocumentUploadSection";
import { LetterEditor } from "@/components/disputes/LetterEditor";
import { ManualTradelineModal } from "@/components/disputes/ManualTradelineModal";
import { TradelineList } from "@/components/disputes/TradelineList";
import { UserInfoForm } from "@/components/disputes/UserInfoForm";
import { TradelineGrid } from "@/components/disputes/TradelineGrid";
import { groupTradelinesByAccount, BureauTradeline } from "@/utils/groupTradelinesByAccount";

const DisputeWizardPage = () => {
  const { user } = useAuth();
  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [selectedTradelines, setSelectedTradelines] = useState<ParsedTradeline[]>([]);
  const [userInfo, setUserInfo] = useState({ name: "", address: "", city: "", state: "", zip: "" });
  const [letter, setLetter] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [showDocsSection, setShowDocsSection] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    (async () => {
      workerRef.current = await createWorker();
    })();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setTradelines([]);
    setSelectedTradelines([]);
    setLetter("");

    try {
      const buffer = await file.arrayBuffer();
      const images = await pdfToImages(buffer);
      let textContent = "";
      for (let i = 0; i < images.length; i++) {
        if (!workerRef.current) throw new Error("Worker not initialized");
        const { data } = await workerRef.current.recognize(images[i]);
        textContent += data.text + "\n";
        setUploadProgress(((i + 1) / images.length) * 100);
      }
      const parsed = parseTradelinesFromText(textContent);
      setTradelines(parsed);
      if (user) await saveTradelinesToDatabase(parsed, user.id);
      toast({ title: "Upload complete", description: "Tradelines extracted." });
    } catch (error: unknown) {
      console.error("PDF processing error:", (error as Error).message);
      toast({ title: "Error", description: "Failed to process PDF." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
      <Card className="max-w-6xl mx-auto space-y-6">
        <CardHeader>
          <CardTitle className="text-2xl">Dispute Wizard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Label htmlFor="pdf-upload">Upload Credit Report (PDF)</Label>
          <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileUpload} disabled={isUploading} />
          {isUploading && <Progress value={uploadProgress} className="w-full" />}

          <TradelineGrid tradelines={groupTradelinesByAccount(tradelines as BureauTradeline[])} />

          <TradelineList
            tradelines={tradelines}
            selected={selectedTradelines}
            setSelected={setSelectedTradelines}
            onAddManual={() => setManualModalOpen(true)}
          />

          <UserInfoForm userInfo={userInfo} onChange={setUserInfo} />

          <LetterEditor
            userInfo={userInfo}
            selectedTradelines={selectedTradelines}
            letter={letter}
            setLetter={setLetter}
            setShowDocsSection={setShowDocsSection}
          />

          <MailingInstructions />

          {showDocsSection && <DocumentUploadSection onClose={() => setShowDocsSection(false)} />}
          {manualModalOpen && <ManualTradelineModal onClose={() => setManualModalOpen(false)} onAdd={t => setTradelines([...tradelines, t])} />}
        </CardContent>
      </Card>
    </main>
  );
};

export default DisputeWizardPage;