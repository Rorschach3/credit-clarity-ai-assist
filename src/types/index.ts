import { ParsedTradeline } from "@/utils/tradelineParser";

export interface DocumentAIResponse {
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

// Removed AIAnalysisResponse as it's no longer used after removing AI analysis from CreditReportUploadPage.tsx
// export interface AIAnalysisResponse { ... }

// Removed ProcessingMethod as it's no longer used
// export type ProcessingMethod = 'ocr' | 'ai';

// Removed CreditBureau as it's no longer used directly in types/index.ts
// export type CreditBureau = "equifax" | "transunion" | "experian" | "";

export type { ParsedTradeline };