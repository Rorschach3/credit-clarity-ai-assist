import { ChangeEvent, useCallback } from 'react';
import { toast as sonnerToast } from "sonner";
import { ParsedTradeline, ParsedTradelineSchema } from "@/utils/tradelineParser";
import { v4 as uuidv4 } from 'uuid';
import { processAndSaveTradelines } from '@/utils/document-ai-processor';


// Sanitize tradelines before validation
function sanitizeTradelines(tradelines: ParsedTradeline[]): ParsedTradeline[] {
  return tradelines.map((t) => {

    // Ensure credit_bureau is a non-empty string
    const credit_bureau = typeof t.credit_bureau === 'string' && t.credit_bureau.trim().length > 0
      ? t.credit_bureau.trim()
      : ''; // You can change this default if desired

    return {
      ...t,
      credit_bureau,
    };
  });
}

interface FileUploadHandlerProps {
  user: { id: string; email?: string } | null;
  processingMethod: 'ocr' | 'ai';
  onUploadStart: () => void;
  onUploadComplete: (tradelines: ParsedTradeline[]) => void;
  onUploadError: (error: string) => void;
  setUploadProgress: (progress: number) => void;
  setExtractedKeywords: (keywords: string[]) => void;
  setAiInsights: (insights: string) => void;
  setExtractedText: (text: string) => void;
  setShowAiResults?: (show: boolean) => void; // Made optional
  extractKeywordsFromText: (text: string) => string[];
  generateAIInsights: (text: string, keywords: string[]) => string;
}

// File validation
const validateFile = (file: File): void => {
  const allowedTypes = ['application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const minSize = 100; // 100 bytes minimum

  console.log(`🔍 Validating file: ${file.name}, type: ${file.type}, size: ${file.size}`);

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PDF files are supported.');
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds 10MB limit.`);
  }

  if (file.size < minSize) {
    throw new Error('File appears to be empty.');
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('File must have a .pdf extension.');
  }

  console.log('✅ File validation passed');
};


// Enhanced processing function using Supabase edge function
const processCreditReportWithAPI = async (file: File, userId: string): Promise<ParsedTradeline[]> => {
  console.log(`🚀 Starting Supabase edge function processing for file: ${file.name}, user: ${userId}`);
  
  try {
    // Use the Supabase-connected processor
    const tradelines = await processAndSaveTradelines(file);
    
    // Convert to proper format with required fields
    const formattedTradelines: ParsedTradeline[] = tradelines.map(t => ({
      id: uuidv4(),
      user_id: userId,
      creditor_name: t.creditor_name || 'Unknown Creditor',
      account_balance: t.account_balance || '0',
      created_at: new Date().toISOString(),
      dispute_count: 0,
      credit_limit: t.credit_limit || '0',
      monthly_payment: t.monthly_payment || '0',
      account_number: t.account_number || 'Unknown',
      date_opened: t.date_opened || new Date().toISOString().split('T')[0],
      is_negative: t.is_negative || false,
      account_type: t.account_type || 'unknown',
      account_status: t.account_status || 'unknown',
      credit_bureau: t.credit_bureau || 'Unknown',
    }));

    console.log(`✅ Successfully processed ${formattedTradelines.length} tradelines via Supabase`);
    return formattedTradelines;

  } catch (error) {
    console.error('❌ Supabase processing failed:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Unknown error occurred: ${String(error)}`);
  }
};



// Test Supabase edge function connectivity
const testApiConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔗 Testing Supabase edge function connectivity...');
    
    // Simple test to see if Supabase functions are accessible
    // We don't actually call the function, just check if it exists
    const { supabase } = await import('@/integrations/supabase/client');
    
    if (!supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }
    
    console.log('✅ Supabase client is available');
    return true;
  } catch (error) {
    console.log('❌ Supabase connectivity test failed:', error);
    return false;
  }
};

// Progress stages
const PROGRESS_STAGES = {
  VALIDATION: 10,
  CONNECTIVITY_CHECK: 20,
  UPLOADING: 40,
  PROCESSING: 70,
  PARSING: 90,
  COMPLETE: 100
} as const;

export const useFileUploadHandler = ({
  user,
  processingMethod,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  setUploadProgress,
  setExtractedKeywords,
  setAiInsights,
  setExtractedText,
  setShowAiResults,
  extractKeywordsFromText,
  generateAIInsights
}: FileUploadHandlerProps) => {
  
  // Reset UI state
  const resetUploadState = useCallback(() => {
    setUploadProgress(0);
    setExtractedKeywords([]);
    setAiInsights('');
    setExtractedText('');
    setShowAiResults?.(false); // Use optional chaining
  }, [setUploadProgress, setExtractedKeywords, setAiInsights, setExtractedText, setShowAiResults]);

  // Enhanced upload handler with debugging
  const handleFileUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    console.log("🚀 ===== Starting file upload process =====");
    
    try {
      const file = event.target.files?.[0];
      if (!file) {
        console.log("❌ No file selected");
        return;
      }

      // Reset input to allow re-uploading same file (AFTER we get the file)
      event.target.value = '';

      console.log(`📄 Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Step 1: Validate file
      setUploadProgress(PROGRESS_STAGES.VALIDATION);
      try {
        validateFile(file);
      } catch (validationError) {
        const errorMessage = validationError instanceof Error ? validationError.message : "Invalid file";
        console.error('❌ File validation failed:', errorMessage);
        sonnerToast(errorMessage, { description: "Invalid File" });
        return;
      }

      // Step 2: Check authentication
      if (!user?.id) {
        console.error('❌ User not authenticated');
        sonnerToast("Please log in to upload files.", { description: "Authentication Required" });
        return;
      }

      console.log(`👤 Authenticated user: ${user.id}`);

      // Step 3: Test API connectivity
      setUploadProgress(PROGRESS_STAGES.CONNECTIVITY_CHECK);
      sonnerToast("Testing API connectivity...", { description: "Connection Check" });
      
      const isConnected = await testApiConnectivity();
      if (!isConnected) {
        console.error('❌ API connectivity test failed');
        sonnerToast("Unable to connect to processing API. Please check your connection.", { 
          description: "Connection Failed" 
        });
        // Continue anyway - might still work
      }

      // Step 4: Start upload process
      onUploadStart();
      resetUploadState();
      setShowAiResults?.(true); // Use optional chaining

      console.log(`📄 Processing ${file.name} for user ${user.id}`);
      
      // Step 5: Upload and process
      setUploadProgress(PROGRESS_STAGES.UPLOADING);
      sonnerToast("Uploading to Document AI...", { description: "Processing" });

      const startTime = Date.now();
      const tradelinesRaw = await processCreditReportWithAPI(file, user.id);
      const tradelines = sanitizeTradelines(tradelinesRaw);
      const processingTime = Date.now() - startTime;
      
      console.log(`⏱️ Total processing time: ${processingTime}ms`);
      
      setUploadProgress(PROGRESS_STAGES.PROCESSING);

      // Step 6: Validate tradelines with Zod
      console.log(`🔍 Validating ${tradelines.length} tradelines with Zod schema`);
      const validTradelines = tradelines
        .map((t, index) => {
          try {
            const validated = ParsedTradelineSchema.parse(t);
            console.log(`✅ Tradeline ${index + 1} validated:`, validated.creditor_name);
            return validated;
          } catch (e) {
            console.warn(`⚠️ Invalid tradeline ${index + 1} skipped:`, e, t);
            return null;
          }
        })
        .filter((t): t is ParsedTradeline => t !== null);

      console.log(`✅ ${validTradelines.length} of ${tradelines.length} tradelines are valid`);

      setUploadProgress(PROGRESS_STAGES.PARSING);

      // Step 7: Generate UI insights for display
      if (validTradelines.length > 0) {
        const creditorNames = validTradelines.map(t => t.creditor_name).filter(Boolean);
        const accountTypes = validTradelines.map(t => t.account_type).filter(Boolean);
        
        console.log('📊 Extracted creditors:', creditorNames);
        console.log('📊 Extracted account types:', accountTypes);
        
        setExtractedKeywords([...new Set([...creditorNames, ...accountTypes])]);
        
        const insights = `Found ${validTradelines.length} tradelines. ` +
          `Creditors: ${creditorNames.slice(0, 3).join(', ')}${creditorNames.length > 3 ? '...' : ''}. ` +
          `Account types: ${[...new Set(accountTypes)].join(', ')}.`;
        
        setAiInsights(insights);
        setExtractedText(`Successfully processed ${validTradelines.length} tradelines from ${file.name} in ${processingTime}ms`);
      } else {
        console.log('⚠️ No valid tradelines found');
        setExtractedText(`Processed ${file.name} but found no valid tradelines`);
      }

      setUploadProgress(PROGRESS_STAGES.COMPLETE);
      
      // Step 8: Complete upload
      onUploadComplete(validTradelines);
      
      // Success message
      const message = validTradelines.length > 0 
        ? `✅ Successfully processed ${validTradelines.length} tradeline${validTradelines.length !== 1 ? 's' : ''}!`
        : "⚠️ Document processed but no tradelines found.";
      
      console.log('🎉 Upload completed successfully');
      sonnerToast(message, { description: "Upload Complete" });
      
    } catch (error) {
      console.error("❌ ===== Upload failed =====");
      console.error("Error details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      resetUploadState();
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      onUploadError(errorMessage);
      sonnerToast(`Processing failed: ${errorMessage}`, { description: "Error" });
    }
  }, [
    user?.id,
    processingMethod,
    onUploadStart,
    onUploadComplete,
    onUploadError,
    setUploadProgress,
    setExtractedKeywords,
    setAiInsights,
    setExtractedText,
    setShowAiResults,
    extractKeywordsFromText,
    generateAIInsights,
    resetUploadState
  ]);

  return { 
    handleFileUpload,
    resetUploadState 
  };
};