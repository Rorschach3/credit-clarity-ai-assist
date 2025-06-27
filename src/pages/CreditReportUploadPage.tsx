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
import {
  saveTradelinesToDatabase,
  parseTradelinesFromText,
  validateAccountType, 
  validateAccountStatus 
} from "@/utils/tradelineParser";
import { ManualTradelineModal } from "@/components/disputes/ManualTradelineModal";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDocumentViaProxy, generateContent } from "@/services/llm-parser";
import { DocumentAIResponse, ParsedTradeline } from "@/types";
import { fileToBase64, sanitizeAIResponse } from "@/utils/helpers";
import { v4 as uuidv4 } from 'uuid';
// Define the AI analysis response interface
interface AIAnalysisResponse {
  tradelines?: Array<{
    creditor_name?: string;
    account_number?: string;
    account_balance?: string;
    account_status?: string;
    account_type?: string;
    credit_limit?: string;
    date_opened?: string;
    monthly_payment?: string;    
    credit_bureau?: string;
    is_negative?: boolean;
    dispute_count?: number;
    raw_text?: string; // Added to match ParsedTradeline
  }>;
  keywords?: string[];
  insights?: string;
  negativeItems?: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
}
interface TradelineItem {
  id?: string;
  creditor_name?: string;
  account_number?: string;
  account_balance?: string;
  account_status?: string;
  account_type?: string;
  credit_limit?: string;
  date_opened?: string;
  monthly_payment?: string;
  is_negative?: boolean;
  dispute_count?: number;
  credit_bureau?: string;
  created_at?: string;
  raw_text?: string;
  user_id?: string;
}

function safeValue<T extends string | number | null | undefined>(v: T): string {
  if (typeof v === "number") return String(v);
  return v ?? "";
}

const CreditReportUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const workerRef = useRef<Worker | null>(null);
  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [selectedTradelineIds, setSelectedTradelineIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'ocr' | 'ai'>('ocr');
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [showAiResults, setShowAiResults] = useState(false);





  useEffect(() => {
    console.log("Current tradelines:", tradelines);
  }, [tradelines]);

  const handleSelectTradeline = (id: string, isSelected: boolean) => {
    setSelectedTradelineIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Initialize OCR worker
  useEffect(() => {
    const initWorker = async () => {
      if (processingMethod === 'ocr' && !workerRef.current) {
        workerRef.current = await createWorker('eng');
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

  const processWithOCR = async (file: File): Promise<string> => {
    if (!workerRef.current) {
      workerRef.current = await createWorker('eng');
    }

    const buffer = await file.arrayBuffer();
    const images = await pdfToImages(buffer);
    let textContent = "";
    
    for (let i = 0; i < images.length; i++) {
      const { data } = await workerRef.current.recognize(images[i]);
      textContent += data.text + "\n";
      setUploadProgress(((i + 1) / images.length) * 50); // 50% for OCR
    }
    
    return textContent;
  };

  const processAIResponse = async (aiResponse: string, extractedText: string): Promise<void> => {
    if (!aiResponse.trim()) {
      console.warn('AI returned empty response');
      setAiInsights('AI analysis completed but no insights were generated.');
      return;
    }

    try {
      // Clean up the response - sometimes AI returns markdown code blocks
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Sanitize the response before parsing
      const sanitizedResponse = sanitizeAIResponse(cleanedResponse);
      const parsedAI: AIAnalysisResponse = JSON.parse(sanitizedResponse);
      
      setExtractedKeywords(parsedAI.keywords || []);
      setAiInsights(parsedAI.insights || '');
      
      // Convert AI tradelines to ParsedTradeline format and add to existing tradelines
      if (parsedAI.tradelines && parsedAI.tradelines.length > 0) {
        const convertedTradelines = parsedAI.tradelines.map((item) => ({
          id: uuidv4(),
          creditor_name: item.creditor_name || '',
          account_number: item.account_number || '',
          account_balance: item.account_balance || '$0',
          account_status: validateAccountStatus(item.account_status || "") || "",
          account_type: validateAccountType(item.account_type) || "credit_card",
          credit_limit: item.credit_limit || '$0',
          date_opened: item.date_opened || '',
          monthly_payment: item.monthly_payment || '$0',
          is_negative: Boolean(item.is_negative),
          dispute_count: Number(item.dispute_count) || 0,
          credit_bureau: validateCreditBureau(item.credit_bureau) || '',
          created_at: new Date().toISOString(),
          raw_text: extractedText, // Add this required property
          user_id: user?.id || ''
        }));

        const transformToValidTradeline = (item: TradelineItem): ParsedTradeline => ({
          id: item.id,
          creditor_name: item.creditor_name || '',
          account_number: item.account_number || '',
          account_balance: item.account_balance || '$0',
          account_status: validateAccountStatus(item.account_status) || "",
          account_type: validateAccountType(item.account_type) || "credit_card",
          credit_limit: item.credit_limit || '$0',
          date_opened: item.date_opened || '',
          monthly_payment: item.monthly_payment || '$0',
          is_negative: Boolean(item.is_negative),
          dispute_count: Number(item.dispute_count) || 0,
          credit_bureau: validateCreditBureau(item.credit_bureau) || "", // Ensure valid union type
          created_at: item.created_at || new Date().toISOString(),
          raw_text: item.raw_text || '',
          user_id: item.user_id || user?.id || ''
        });

        // When updating tradelines state
        setTradelines(prev => [
          ...prev,
          ...convertedTradelines.map(transformToValidTradeline)
        ]);
        console.log(`Successfully extracted ${convertedTradelines.length} tradelines via AI`);
      }
    } catch (jsonError) {
      console.error('Failed to parse AI response as JSON:', jsonError);
      console.log('AI Response that failed to parse:', sanitizeAIResponse);
      
      // If JSON parsing fails, treat as plain text insights
      setAiInsights(aiResponse || 'AI analysis completed but response format was invalid.');
      
      // Extract keywords using a simple approach from the original text
      const keywords = extractedText
        .toLowerCase()
        .match(/\b(credit|debt|payment|balance|collection|charge.?off|bankruptcy|foreclosure|late|delinquent|dispute|inquiry)\b/g) || [];
      setExtractedKeywords([...new Set(keywords)]);
      
      // Also try to parse tradelines using the traditional parser as fallback
      try {
        const fallbackTradelines = await parseTradelinesFromText(extractedText, user?.id || "");
        if (fallbackTradelines.length > 0) {
          setTradelines(prev => [...prev, ...fallbackTradelines]);
          console.log(`Fallback: extracted ${fallbackTradelines.length} tradelines via traditional parser`);
        }
      } catch (parseError) {
        console.error('Traditional parser also failed:', parseError);
      }
    }
  };

  const processWithAI = async (file: File): Promise<string> => {
    try {
      console.log("Calling parseDocumentViaProxy with base64 content...");
      // Convert file to base64
      const base64Content = await fileToBase64(file);
      setUploadProgress(25);

      let extractedText = '';
      let documentProcessed = false;

      // Try Document AI first
      try {
        const documentData = await parseDocumentViaProxy(base64Content) as DocumentAIResponse | undefined;
        console.log("Document AI response:", documentData);
        
        if (documentData?.document?.text) {
          extractedText = documentData.document.text;
          documentProcessed = true;
          setUploadProgress(50);
        } else {
          console.warn("Document AI returned no text, will fallback to OCR");
        }
      } catch (docAIError) {
        console.error('Document AI failed:', docAIError);
        console.log("Falling back to OCR for text extraction...");
      }

      // If Document AI failed, use OCR as fallback for text extraction
      if (!documentProcessed) {
        extractedText = await processWithOCR(file);
        setUploadProgress(50);
      }

      // If we have extracted text, try to use Gemini for analysis
      if (extractedText.trim()) {
        try {
          const prompt = `
            Analyze this credit report and extract the following information:
            1. All tradelines with their details (creditor name, account number, balance, status, etc.)
            2. Key financial keywords and terms found in the document
            3. Any negative items or disputes mentioned
            4. Credit score information if available
            
            Please format the response as JSON with the following structure (use snake_case for field names):
            {
              "tradelines": [
                {
                  "creditor_name": "string",
                  "account_number": "string", 
                  "balance": number,
                  "status": "string",
                  "account_type": "string",
                  "credit_limit": number,
                  "date_opened": "YYYY-MM-DD",
                  "monthly_payment": number,
                  "credit_bureau": "string"
                }
              ],
              "keywords": ["array", "of", "strings"],
              "insights": "summary of key findings",
              "negativeItems": [
                {
                  "type": "string",
                  "description": "string", 
                  "impact": "string"
                }
              ]
            }
          `;

          let aiResponse = '';
          
          // Use Gemini for content analysis
          await generateContent(
            [
              {
                role: "user",
                parts: [
                  {
                    text: `${prompt}\n\nCredit Report Content:\n${extractedText}`
                  }
                ]
              }
            ],
            (chunk: string) => {
              aiResponse += chunk;
            }
          );

          setUploadProgress(75);
          console.log("Raw AI response:", aiResponse);
          
          await processAIResponse(aiResponse, extractedText);
          
        } catch (geminiError) {
          console.error('Gemini analysis failed:', geminiError);
          setAiInsights('AI analysis failed. Using basic keyword extraction.');
          
          // Basic keyword extraction as final fallback
          const keywords = extractedText
            .toLowerCase()
            .match(/\b(credit|debt|payment|balance|collection|charge.?off|bankruptcy|foreclosure|late|delinquent|dispute|inquiry)\b/g) || [];
          setExtractedKeywords([...new Set(keywords)]);
        }
      } else {
        throw new Error('No text could be extracted from the document');
      }
      
      setUploadProgress(100);
      console.log("AI processing completed. Extracted text length:", extractedText.length);
      return extractedText;
      
    } catch (error) {
      console.error('AI processing error:', error);
      toast({ 
        title: "AI Processing Failed", 
        description: "Failed to process with AI. Falling back to OCR.",
        variant: "destructive"
      });
      
      // Complete fallback to OCR
      return await processWithOCR(file);
    }
  };

  const saveTradelines = useCallback(async () => {
    if (user && tradelines.length > 0) {
      try {
        console.log('Parsed tradelines before saving:', tradelines);
        await saveTradelinesToDatabase(tradelines, user.id);
        console.log(`Saved ${tradelines.length} tradelines to database`);
      } catch (saveError) {
        console.error('Failed to save tradelines:', saveError);
        toast({
          title: "Save Warning",
          description: "Tradelines extracted but failed to save to database.",
          variant: "destructive"
        });
      }
    }
  }, [user, tradelines]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileUpload triggered");
    try {
      const file = event.target.files?.[0];
      if (!file || file.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file." });
        console.warn("Invalid file type or no file selected.");
        return;
      }
      if (!user || !user.id) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        console.error("User not logged in or user.id is missing.");
        return;
      }

      setIsUploading(true);
      setTradelines([]); // Clear previous tradelines on new upload
      setUploadProgress(0);
      setExtractedKeywords([]);
      setAiInsights('');
      setShowAiResults(true);

      let textContent = '';
      
      if (processingMethod === 'ai') {
        textContent = await processWithAI(file);
        setShowAiResults(true);
        // Note: AI processing handles tradeline extraction internally
      } else {
        textContent = await processWithOCR(file);
        // Parse tradelines from OCR text using existing parser
        try {
          const parsed = await parseTradelinesFromText(textContent, user.id);
          setTradelines(parsed);
          console.log("Parsed tradelines successfully", parsed);
        } catch (parseError) {
          console.error("Tradeline parsing failed:", parseError);
          toast({ title: "Error", description: "Failed to parse tradelines.", variant: "destructive" });
        }
      }

      console.log("User object:", user);
      console.log("Tradelines prepared for saving:", tradelines);
      
      
      toast({
        title: "Upload complete",
        description: `Document processed using ${processingMethod.toUpperCase()}.`
      });
    } catch (error) {
      console.error("PDF processing error (caught in handleFileUpload):", error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: "Failed to process PDF. Please try again or use a different processing method.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Effect to save tradelines when they are updated
  useEffect(() => {
    if (tradelines.length > 0 && user?.id) {
      console.log("useEffect triggered to save tradelines:", tradelines); // Added for debugging
      const timeoutId = setTimeout(() => {
        saveTradelines();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tradelines, user, saveTradelines]);

  const updateTradeline = (index: number, updated: Partial<ParsedTradeline>) => {
    setTradelines((prev) => {
      const newTradelines = [...prev];
      newTradelines[index] = { ...newTradelines[index], ...updated };
      console.log("Updated tradeline:", newTradelines[index]);
      return newTradelines;
    });
  };

  const deleteTradeline = (index: number) => {
    setTradelines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceed = () => {
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
              <Label htmlFor="processing-method" className="mb-2 block">Processing Method</Label>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={processingMethod === 'ocr' ? 'default' : 'outline'}
                  onClick={() => setProcessingMethod('ocr')}
                >
                  OCR (Fast)
                </Button>
                <Button
                  variant={processingMethod === 'ai' ? 'default' : 'outline'}
                  onClick={() => setProcessingMethod('ai')}
                >
                  AI Analysis (Advanced)
                </Button>
              </div>
              
              <Label htmlFor="pdf-upload">Upload Credit Report (PDF)</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing with {processingMethod.toUpperCase()}... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>

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
                  <div key={t.id || i} className="border p-4 rounded mb-3 space-y-2">
                    <div className="flex items-center mb-2">
                      <Checkbox
                        id={`select-tradeline-${t.id}`}
                        checked={selectedTradelineIds.has(t.id || '')}
                        onCheckedChange={(checked) => handleSelectTradeline(t.id || '', checked as boolean)}
                        className="mr-2"
                      />
                      <Label htmlFor={`select-tradeline-${t.id}`} className="font-semibold">
                        Select for Dispute
                      </Label>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Creditor Name</label>
                      <Input
                        value={safeValue(t.creditor_name)}
                        onChange={(e) => updateTradeline(i, { creditor_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Account Number</label>
                      <Input
                        value={safeValue(t.account_number)}
                        onChange={(e) => updateTradeline(i, { account_number: e.target.value })}
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
                        onChange={(e) =>
                          updateTradeline(i, { account_balance: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Credit Limit</label>
                      <Input
                        type="text"
                        value={safeValue(t.credit_limit)}
                        onChange={(e) =>
                          updateTradeline(i, { credit_limit: e.target.value })
                        }
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
                      credit_bureau: value as "equifax" | "transunion" | "experian"
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
                        onChange={(e) =>
                          updateTradeline(i, { monthly_payment: e.target.value })
                        }
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
              <Button onClick={handleProceed} disabled={selectedTradelineIds.size === 0}>
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

function validateCreditBureau(credit_bureau: string | undefined): 'equifax' | 'transunion' | 'experian' | '' {
  if (!credit_bureau) return '';
  const validBureaus = ['equifax', 'transunion', 'experian', ''];
  return validBureaus.includes(credit_bureau) ? credit_bureau as 'equifax' | 'transunion' | 'experian' : '';
}
