"use client";
import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { createWorker, Worker } from "tesseract.js";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { pdfToImages } from "@/utils/pdfToImage";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/MainLayout";
import {
  saveTradelinesToDatabase,
  parseTradelinesFromText,
} from "@/utils/tradelineParser";
import { ManualTradelineModal } from "@/components/disputes/ManualTradelineModal";
import { ParsedTradelineSchema, ParsedTradeline } from "@/utils/tradelineParser";
import { z, ZodError, ZodIssue } from "zod";
import { toast } from "@/components/ui/use-toast";

const CreditReportUploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);

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

    try {
      const buffer = await file.arrayBuffer();
      console.log("PDF buffer created");
      const images = await pdfToImages(buffer);
      console.log("PDF converted to images", images.length);
      let textContent = "";
      for (let i = 0; i < images.length; i++) {
        if (!workerRef.current) throw new Error("Worker not initialized");
        try {
          const { data } = await workerRef.current.recognize(images[i]);
          textContent += data.text + "\n";
          setUploadProgress(((i + 1) / images.length) * 100);
          console.log(`Image ${i + 1} processed`);
        } catch (ocrError: unknown) {
          console.error("OCR error:", ocrError);
          toast({ title: "OCR Error", description: `Failed to recognize text in image ${i + 1}.` });
        }
      }
      console.log("All images processed, parsing tradelines");
      const parsed = parseTradelinesFromText(textContent);
      try {
        console.log("Parsed tradelines:", parsed);
        const validatedTradelines = z.array(ParsedTradelineSchema).parse(parsed);
        setTradelines(validatedTradelines);
        if (user) {
          try {
            await saveTradelinesToDatabase(validatedTradelines, user.id);
            toast({ title: "Upload complete", description: "Tradelines extracted and saved." });
          } catch (dbError: unknown) {
            console.error("Database error:", dbError);
            toast({ title: "Database Error", description: "Failed to save tradelines to the database." });
          }
        }
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          toast({
            title: "Validation Error",
            description: error.errors.map((e: ZodIssue) => e.message).join(", "),
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to parse tradelines.",
          });
        }
        console.error("Error parsing tradelines:", error);
      }
    } catch (error: unknown) {
      console.error("File processing error:", error);
      toast({ title: "File Error", description: `Failed to process PDF: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const updateTradeline = (index: number, updated: Partial<ParsedTradeline>) => {
    try {
      const newTradeline = { ...tradelines[index], ...updated };
      ParsedTradelineSchema.parse(newTradeline); // Validate the updated tradeline
      setTradelines((prev: ParsedTradeline[]) => {
        const newTradelines = [...prev];
        newTradelines[index] = newTradeline;
        return newTradelines;
      });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors.map((e: ZodIssue) => e.message).join(", "),
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update tradeline.",
        });
      }
      console.error("Error updating tradeline:", error);
    }
  };

  const deleteTradeline = (index: number) => {
    setTradelines((prev: ParsedTradeline[]) => prev.filter((_, i) => i !== index));
  };

  const handleProceed = () => {
    // Navigate to dispute letter page
    navigate("/dispute-letter");
  };

  return (
   <MainLayout>
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
     <Card className="max-w-6xl mx-auto space-y-6">
      <CardHeader>
          <CardTitle className="text-2xl">Step 1: Upload or Add Tradelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="pdf-upload">Upload Credit Report (PDF)</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading && <Progress value={uploadProgress} className="w-full" />}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="block">Tradelines</Label>
              <Button size="sm" variant="outline" onClick={() => setManualModalOpen(true)}>
                + Add Tradeline Manually
              </Button>
            </div>
            {tradelines.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tradelines found.</p>
            ) : (
              tradelines.map((t, i) => (
                <div key={i} className="border p-4 rounded mb-3 space-y-2">
                  <div>
                    <label className="block font-semibold mb-1">Creditor Name</label>
                    <Input
                      value={t.creditorName || ""}
                      onChange={(e) => updateTradeline(i, { creditorName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Account Number</label>
                    <Input
                      value={t.accountNumber || ""}
                      onChange={(e) => updateTradeline(i, { accountNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Status</label>
                    <Input
                      value={t.status || ""}
                      onChange={(e) => updateTradeline(i, { status: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Balance</label>
                    <Input
                      type="number"
                      value={t.balance !== undefined ? t.balance : ""}
                      onChange={(e) =>
                        updateTradeline(i, { balance: String(parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Date Opened</label>
                    <Input
                      type="date"
                      value={t.dateOpened || ""}
                      onChange={(e) => updateTradeline(i, { dateOpened: e.target.value })}
                    />
                  </div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTradeline(i)}
                      className="mt-2"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button onClick={handleProceed} disabled={tradelines.length === 0}>
              Proceed to Step 2
            </Button>
          </div>

          {manualModalOpen && (
            <ManualTradelineModal
              onClose={() => setManualModalOpen(false)}
              onAdd={(t) => setTradelines([...tradelines, t])}
            />
          )}
        </CardContent>
      </Card>
    </div>
   </MainLayout>
  );
};

export default CreditReportUploadPage;