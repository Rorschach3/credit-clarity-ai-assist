
import { supabase } from "@/integrations/supabase/client";

// Types for AI analysis results
export interface ExtractedText {
  rawText: string;
  structuredData: {
    personalInfo?: {
      name?: string;
      address?: string;
      ssn?: string;
    };
    accounts: ExtractedAccount[];
  };
}

export interface ExtractedAccount {
  id: string;
  creditorName: string;
  accountNumber: string;
  amount: string;
  dateReported: string;
  bureaus: string[];
  reason: string;
  status: string;
  score?: number; // AI-generated score for dispute potential
  recommendedReason?: string; // AI-recommended dispute reason
}

export interface DisputeAnalysis {
  negativeItems: ExtractedAccount[];
  recommendedDisputes: ExtractedAccount[];
  analysisNotes: string;
}

export interface GeneratedLetter {
  content: string;
  qualityScore: number;
  suggestions: string[];
}

// Main AI service functions
export const aiService = {
  // Extract text and structure data from document using OCR and AI
  async extractTextFromDocument(
    fileUrl: string,
    fileType: string
  ): Promise<ExtractedText> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-extraction', {
        body: {
          fileUrl,
          fileType
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in AI text extraction:', error);
      throw new Error('Failed to extract text from document');
    }
  },
  
  // Analyze credit report to identify negative items
  async analyzeReport(extractedText: ExtractedText): Promise<DisputeAnalysis> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-report-analysis', {
        body: {
          extractedText
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in AI report analysis:', error);
      throw new Error('Failed to analyze credit report');
    }
  },
  
  // Generate dispute letter with AI
  async generateDisputeLetter(
    items: ExtractedAccount[],
    bureau: string,
    userData: any
  ): Promise<GeneratedLetter> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-letter-generator', {
        body: {
          items,
          bureau,
          userData
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in AI letter generation:', error);
      throw new Error('Failed to generate dispute letter');
    }
  },
  
  // Validate and improve quality of AI-generated letter
  async reviewDisputeLetter(
    letterContent: string,
    bureau: string
  ): Promise<GeneratedLetter> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-letter-review', {
        body: {
          letterContent,
          bureau
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in AI letter review:', error);
      throw new Error('Failed to review dispute letter');
    }
  }
};
