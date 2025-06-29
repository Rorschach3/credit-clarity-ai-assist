"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { createWorker, Worker } from "tesseract.js";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pdfToImages } from "@/utils/pdfToImage";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/MainLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParsedTradeline } from '@/utils/tradelineParser';
import {
  saveTradelinesToDatabase,
  parseTradelinesFromText, // Now uses extractAllTradelines internally
  validateAccountType,
  validateAccountStatus
} from "@/utils/tradelineParser";
import { ManualTradelineModal } from "@/components/disputes/ManualTradelineModal";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDocumentViaProxy } from "@/services/llm-parser";
import { fileToBase64 } from "@/utils/helpers";

// Types
type CreditBureau = 'equifax' | 'transunion' | 'experian';
type ProcessingMethod = 'ocr' | 'ai'; // 'ai' now means using LLM for full tradeline extraction after text extraction

// Utility functions
const safeValue = <T extends string | number | null | undefined>(v: T): string => {
  if (typeof v === "number") return String(v);
  return v ?? "";
};

const validateCreditBureau = (credit_bureau: string | undefined): CreditBureau => {
  if (!credit_bureau) return 'equifax';
  const validBureaus: CreditBureau[] = ['equifax', 'transunion', 'experian'];
  return validBureaus.includes(credit_bureau as CreditBureau)
    ? credit_bureau as CreditBureau
    : 'equifax';
};

const CreditReportUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const workerRef = useRef<Worker | null>(null);

  // State
  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [selectedTradelineIds, setSelectedTradelineIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('ai'); // Default to 'ai'
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]); // Keep if still displaying AI keywords/insights
  const [aiInsights, setAiInsights] = useState<string>(''); // Keep if still displaying AI keywords/insights
  const [showAiResults, setShowAiResults] = useState(false); // Keep if still displaying AI keywords/insights

  // Debug logging
  useEffect(() => {
    console.log("Current tradelines:", tradelines);
  }, [tradelines]);

  // Event handlers
  const handleSelectTradeline = useCallback((id: string, isSelected: boolean) => {
    setSelectedTradelineIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleProceedToDispute = useCallback(() => {
    const selectedTradelinesArray = Array.from(selectedTradelineIds)
      .map(id => tradelines.find(tl => tl.id === id))
      .filter(Boolean) as ParsedTradeline[];

    navigate("/dispute-letter", { state: { selectedTradelines: selectedTradelinesArray } });
  }, [navigate, selectedTradelineIds, tradelines]); // Added tradelines to dependency array

  // OCR Worker initialization
  useEffect(() => {
    const initWorker = async () => {
      // Initialize OCR worker only if OCR method is selected
      if (processingMethod === 'ocr' && !workerRef.current) {
        try {
          workerRef.current = await createWorker('eng');
        } catch (error) {
          console.error('Failed to initialize OCR worker:', error);
          toast({
            title: "OCR Initialization Failed",
            description: "Unable to initialize OCR. Try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [processingMethod]);

  // Process PDF to get raw text (using OCR or Document AI)
  const getRawTextFromPdf = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const base64Content = await fileToBase64(file);
    onProgress(25); // Indicate initial progress for file reading/conversion

    let extractedText = '';

    if (processingMethod === 'ai') {
      try {
        const documentData = await parseDocumentViaProxy(base64Content);
        if (documentData?.text) {
          extractedText = documentData.text;
          console.log('Text extracted using Document AI.');
          setAiInsights(documentData.insights || ''); // Capture insights if available
          setExtractedKeywords(documentData.keywords || []); // Capture keywords if available
        } else {
          console.warn('Document AI returned no text or failed, falling back to OCR.');
        }
      } catch (docAIError) {
        console.error('Document AI failed:', docAIError);
        console.warn('Falling back to OCR due to Document AI error.');
      }
    }

    if (!extractedText) { // Fallback to OCR if Document AI failed or was not used
      if (!workerRef.current) {
        workerRef.current = await createWorker('eng');
      }
      const buffer = await file.arrayBuffer();
      const images = await pdfToImages(buffer);
      for (let i = 0; i < images.length; i++) {
        const { data } = await workerRef.current.recognize(images[i]);
        extractedText += data.text + "\n";
        onProgress(25 + ((i + 1) / images.length) * 25); // Progress from 25% to 50%
      }
      console.log('Text extracted using OCR.');
    }
    
    onProgress(50); // Raw text extraction complete
    return extractedText;
  };

  // Save tradelines function
  const saveTradelines = useCallback(async () => {
    if (user && tradelines.length > 0) {
      try {
        console.log('Saving tradelines to database:', tradelines);
        await saveTradelinesToDatabase(tradelines, user.id);
        console.log(`Saved ${tradelines.length} tradelines to database`);
        
        toast({
          title: "Success",
          description: `Saved ${tradelines.length} tradelines to database.`,
        });
      } catch (saveError) {
        console.error('Failed to save tradelines:', saveError);
        toast({
          title: "Save Error",
          description: "Tradelines extracted but failed to save to database.",
          variant: "destructive"
        });
      }
    }
  }, [user, tradelines]);

  // File upload handler
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log("File upload initiated");
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload files.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setTradelines([]);
      setSelectedTradelineIds(new Set()); // Clear selections
      setUploadProgress(0);
      setExtractedKeywords([]);
      setAiInsights('');
      setShowAiResults(processingMethod === 'ai'); // Only show AI results section if AI method is selected

      // Step 1: Get raw text from PDF (using selected method)
      const extractedText = await getRawTextFromPdf(file, setUploadProgress);
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the document.');
      }
      
      // Step 2: Parse tradelines using the unified LLM-based parser
      setUploadProgress(75); // Indicate start of tradeline parsing
      const parsed = await parseTradelinesFromText(extractedText, user.id, {
        documentId: 'temp-doc-id', // Placeholder, ideally a real document ID
        onChunk: (chunk) => console.log('LLM chunk:', chunk), // For streaming feedback
        fallbackToBasicParsing: true // Allow fallback if LLM extraction fails
      });
      setTradelines(parsed);
      console.log("Parsed tradelines successfully:", parsed);
      
      setUploadProgress(100); // Parsing complete
      toast({
        title: "Upload Complete",
        description: `Document processed using ${processingMethod.toUpperCase()} and tradelines extracted.`,
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing.';
      console.error("PDF processing error:", error);
      toast({
        title: "Processing Error",
        description: `Failed to process PDF: ${errorMessage}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset file input
    }
  };

  // Auto-save tradelines when they change
  useEffect(() => {
    if (tradelines.length > 0 && user?.id) {
      console.log("Auto-saving tradelines:", tradelines);
      const timeoutId = setTimeout(() => {
        saveTradelines();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tradelines, user, saveTradelines]);

  // Tradeline update/delete functions
  const updateTradeline = useCallback((index: number, updated: Partial<ParsedTradeline>) => {
    setTradelines((prev) => {
      const newTradelines = [...prev];
      newTradelines[index] = { ...newTradelines[index], ...updated };
      console.log("Updated tradeline:", newTradelines[index]);
      return newTradelines;
    });
  }, []);

  const deleteTradeline = useCallback((index: number) => {
    setTradelines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addManualTradeline = useCallback((tradeline: ParsedTradeline) => {
    setTradelines(prev => [...prev, tradeline]);
    setManualModalOpen(false);
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
        <Card className="max-w-6xl mx-auto space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Step 1: Upload or Add Tradelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Processing Method Selection */}
            <div>
              <Label htmlFor="processing-method" className="mb-2 block">Processing Method</Label>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={processingMethod === 'ocr' ? 'default' : 'outline'}
                  onClick={() => setProcessingMethod('ocr')}
                  disabled={isUploading}
                >
                  OCR (Fast)
                </Button>
                <Button
                  variant={processingMethod === 'ai' ? 'default' : 'outline'}
                  onClick={() => setProcessingMethod('ai')}
                  disabled={isUploading}
                >
                  AI Analysis (Advanced)
                </Button>
              </div>
              
              {/* File Upload */}
              <Label htmlFor="pdf-upload">Upload Credit Report (PDF)</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing with {processingMethod.toUpperCase()}... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>

            {/* AI Results */}
            {showAiResults && (extractedKeywords.length > 0 || aiInsights) && (
              <Card>
                <CardContent className="pt-6">
                  <Tabs defaultValue="keywords" className="w-full">
                    <TabsList>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                    </TabsList>
                    <TabsContent value="keywords" className="space-y-2">
                      <h4 className="font-semibold">Extracted Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {extractedKeywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary">{keyword}</Badge>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="insights" className="space-y-2">
                      <h4 className="font-semibold">AI Analysis</h4>
                      <div className="bg-muted p-4 rounded-md text-sm">
                        {aiInsights || "No insights generated."}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Tradelines Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="block">Tradelines ({tradelines.length})</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setManualModalOpen(true)}
                  disabled={isUploading}
                >
                  + Add Tradeline Manually
                </Button>
              </div>
              
              {tradelines.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No tradelines found. Upload a credit report or add one manually.
                </p>
              ) : (
                <div className="space-y-3">
                  {tradelines.map((t, i) => (
                    <div key={t.id || i} className="border p-4 rounded-lg space-y-3">
                      {/* Selection Checkbox */}
                      <div className="flex items-center mb-2">
                        <Checkbox
                          id={`select-tradeline-${t.id}`}
                          checked={selectedTradelineIds.has(t.id)}
                          onCheckedChange={(checked) => handleSelectTradeline(t.id, checked as boolean)}
                          className="mr-2"
                        />
                        <Label htmlFor={`select-tradeline-${t.id}`} className="font-semibold">
                          Select for Dispute
                        </Label>
                      </div>

                      {/* Tradeline Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Creditor Name</label>
                          <Input
                            value={safeValue(t.creditor_name)}
                            onChange={(e) => updateTradeline(i, { creditor_name: e.target.value })}
                            placeholder="Enter creditor name"
                          />
                        </div>
                        
                        <div>
                          <label className="block font-semibold mb-1">Account Number</label>
                          <Input
                            value={safeValue(t.account_number)}
                            onChange={(e) => updateTradeline(i, { account_number: e.target.value })}
                            placeholder="Enter account number"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Status</label>
                          <Select
                            value={safeValue(t.account_status)}
                            onValueChange={(value) => updateTradeline(i, {
                              account_status: value as "" | "open" | "closed" | "in_collection" | "charged_off" | "disputed"
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="in_collection">In Collection</SelectItem>
                              <SelectItem value="charged_off">Charged Off</SelectItem>
                              <SelectItem value="disputed">Disputed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Balance</label>
                          <Input
                            type="text"
                            value={safeValue(t.account_balance)}
                            onChange={(e) => updateTradeline(i, { account_balance: e.target.value })}
                            placeholder="$0.00"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Credit Limit</label>
                          <Input
                            type="text"
                            value={safeValue(t.credit_limit)}
                            onChange={(e) => updateTradeline(i, { credit_limit: e.target.value })}
                            placeholder="$0.00"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Date Opened</label>
                          <Input
                            type="date"
                            value={safeValue(t.date_opened)}
                            onChange={(e) => updateTradeline(i, { date_opened: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Credit Bureau</label>
                          <Select
                            value={safeValue(t.credit_bureau)}
                            onValueChange={(value) => updateTradeline(i, {
                              credit_bureau: value as CreditBureau
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select credit bureau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equifax">Equifax</SelectItem>
                              <SelectItem value="experian">Experian</SelectItem>
                              <SelectItem value="transunion">TransUnion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Monthly Payment</label>
                          <Input
                            type="text"
                            value={safeValue(t.monthly_payment)}
                            onChange={(e) => updateTradeline(i, { monthly_payment: e.target.value })}
                            placeholder="$0.00"
                          />
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTradeline(i)}
                        >
                          Delete Tradeline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                onClick={handleProceedToDispute}
                disabled={selectedTradelineIds.size === 0 || isUploading}
                size="lg"
              >
                Proceed to Dispute Letter ({selectedTradelineIds.size} selected)
              </Button>
            </div>

            {/* Manual Tradeline Modal */}
            {manualModalOpen && (
              <ManualTradelineModal
                onClose={() => setManualModalOpen(false)}
                onAdd={addManualTradeline}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreditReportUploadPage;