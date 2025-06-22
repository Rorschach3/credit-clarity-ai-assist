"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
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
import {
  saveTradelinesToDatabase,
  parseTradelinesFromText,
  ParsedTradeline,
} from "@/utils/tradelineParser";
import { ManualTradelineModal } from "@/components/disputes/ManualTradelineModal";
import { parseDocumentViaProxy, generateContent } from "@/services/llm-parser";

// Type definitions
interface DocumentAIResponse {
  document?: {
    text?: string;
    entities?: Array<{
      mentionText: string;
      type: string;
      confidence: number;
    }>;
    pages?: Array<{
      pageNumber: number;
      dimension: {
        width: number;
        height: number;
      };
    }>;
  };
  error?: {
    code: number;
    message: string;
    details?: Array<{
      [key: string]: unknown;
    }>;
  };
}

interface AIAnalysisResponse {
  tradelines?: Array<{
    creditor_name: string;
    account_number: string;
    balance: number;
    status: string;
    account_type: string;
    credit_limit?: number;
    date_opened?: string;
    monthly_payment?: number;
    credit_bureau?: string;
  }>;
  keywords?: string[];
  insights?: string;
  negativeItems?: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
}

type ProcessingMethod = 'ocr' | 'ai';

type AccountStatus = "open" | "closed" | "in_collection" | "charged_off" | "disputed";
type AccountType = "credit_card" | "loan" | "mortgage" | "auto_loan" | "student_loan" | "collection";
type CreditBureau = "equifax" | "transunion" | "experian";

function safeValue<T extends string | number | null | undefined>(v: T): string {
  if (typeof v === "number") return String(v);
  return v ?? "";
}

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:application/pdf;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
  });
};

/**
 * Sanitizes the AI response to ensure it's safe and properly formatted for parsing.
 * @param response - The raw AI response.
 * @returns The sanitized AI response.
 */
const sanitizeAIResponse = (response: string): string => {
  // Remove potential harmful characters and normalize whitespace
  return response
    .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '')
    .trim();
};

const CreditReportUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const workerRef = useRef<Worker | null>(null);
  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('ocr');
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [showAiResults, setShowAiResults] = useState(false);

  useEffect(() => {
    console.log("Current tradelines:", tradelines);
  }, [tradelines]);

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
        const documentData = await parseDocumentViaProxy(base64Content) as DocumentAIResponse;
        console.log("Document AI response:", documentData);
        
        if (documentData.document?.text) {
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
          if (aiResponse.trim()) {
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
              try {
                const parsedAI: AIAnalysisResponse = JSON.parse(sanitizedResponse);
                setExtractedKeywords(parsedAI.keywords || []);
                setAiInsights(parsedAI.insights || '');
                
                // Convert AI tradelines to ParsedTradeline format and add to existing tradelines
                if (parsedAI.tradelines && parsedAI.tradelines.length > 0) {
                  const convertedTradelines: ParsedTradeline[] = parsedAI.tradelines.map(tl => ({
                    creditor_name: tl.creditor_name || '',
                    account_number: tl.account_number || '',
                    account_balance: String(tl.balance || ''),
                    account_status: tl.status as AccountStatus || 'open',
                    account_type: tl.account_type as AccountType || 'credit_card',
                    credit_limit: String(tl.credit_limit || ''),
                    date_opened: tl.date_opened || '',
                    monthly_payment: String(tl.monthly_payment || ''),
                    credit_bureau: tl.credit_bureau as CreditBureau || 'equifax',
                    user_id: user?.id || '',
                    id: '', // Will be set when saved to database
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }));
                  
                  // Add AI-extracted tradelines to the state
                  setTradelines(prev => [...prev, ...convertedTradelines]);
                  console.log(`Successfully extracted ${convertedTradelines.length} tradelines via AI`);
                }
              } catch (jsonError) {
                console.error('Failed to parse AI response as JSON:', jsonError);
                console.log('AI Response that failed to parse:', sanitizedResponse);
                
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

              const parsedAI: AIAnalysisResponse = JSON.parse(sanitizedResponse);
              
              setExtractedKeywords(parsedAI.keywords || []);
              setAiInsights(parsedAI.insights || '');
              
              // Convert AI tradelines to ParsedTradeline format and add to existing tradelines
              if (parsedAI.tradelines && parsedAI.tradelines.length > 0) {
                const convertedTradelines: ParsedTradeline[] = parsedAI.tradelines.map(tl => ({
                  creditor_name: tl.creditor_name || '',
                  account_number: tl.account_number || '',
                  account_balance: String(tl.balance || ''),
                  account_status: tl.status as AccountStatus || 'open',
                  account_type: tl.account_type as AccountType || 'credit_card',
                  credit_limit: String(tl.credit_limit || ''),
                  date_opened: tl.date_opened || '',
                  monthly_payment: String(tl.monthly_payment || ''),
                  credit_bureau: tl.credit_bureau as CreditBureau || 'equifax',
                  user_id: user?.id || '',
                  id: '', // Will be set when saved to database
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }));
                
                // Add AI-extracted tradelines to the state
                setTradelines(prev => [...prev, ...convertedTradelines]);
                console.log(`Successfully extracted ${convertedTradelines.length} tradelines via AI`);
              }
            } catch (jsonError) {
              console.error('Failed to parse AI response as JSON:', jsonError);
              console.log('AI Response that failed to parse:', aiResponse);
              
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
          } else {
            console.warn('AI returned empty response');
            setAiInsights('AI analysis completed but no insights were generated.');
          }
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file." });
      return;
    }

    setIsUploading(true);
    setTradelines([]); // Clear previous tradelines on new upload
    setUploadProgress(0);
    setExtractedKeywords([]);
    setAiInsights('');
    setShowAiResults(false);

    try {
      let textContent = '';
      
      if (processingMethod === 'ai') {
        textContent = await processWithAI(file);
        setShowAiResults(true);
        // Note: AI processing handles tradeline extraction internally
      } else {
        textContent = await processWithOCR(file);
        // Parse tradelines from OCR text using existing parser
        const parsedPromise = parseTradelinesFromText(textContent, user?.id || "");
        const parsed = await parsedPromise;
        setTradelines(parsed);
      }

      console.log("User object:", user);
      
      // Save tradelines to database after a short delay to ensure state is updated
      setTimeout(async () => {
        if (user && tradelines.length > 0) {
          try {
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
      }, 1000);
      
      toast({ 
        title: "Upload complete", 
        description: `Document processed using ${processingMethod.toUpperCase()}.` 
      });
    } catch (error) {
      console.error("PDF processing error:", error instanceof Error ? error.message : String(error));
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
                  disabled={isUploading}
                >
                  OCR (Fast)
                </Button>
                <Button
                  variant={processingMethod === 'ai' ? 'default' : 'outline'}
                  onClick={() => setProcessingMethod('ai')}
                  disabled={isUploading}
                >
                  AI Enhanced (Slower, More Accurate)
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
                  <div key={i} className="border p-4 rounded mb-3 space-y-2">
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
                      <Input
                        value={safeValue(t.account_status)}
                        onChange={(e) => updateTradeline(i, { account_status: e.target.value as AccountStatus })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Balance</label>
                      <Input
                        type="number"
                        value={safeValue(t.account_balance)}
                        onChange={(e) =>
                          updateTradeline(i, { account_balance: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Credit Limit</label>
                      <Input
                        type="number"
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
                      <label className="block font-semibold mb-1">Account Type</label>
                      <Input
                        value={safeValue(t.account_type)}
                        onChange={(e) => updateTradeline(i, { account_type: e.target.value as AccountType })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Monthly Payment</label>
                      <Input
                        type="number"
                        value={safeValue(t.monthly_payment)}
                        onChange={(e) =>
                          updateTradeline(i, { monthly_payment: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Credit Bureau</label>
                      <Input
                        value={safeValue(t.credit_bureau)}
                        onChange={(e) => updateTradeline(i, { credit_bureau: e.target.value as CreditBureau })}
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