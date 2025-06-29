import { supabase } from "@/integrations/supabase/client";
import type { NegativeItem } from "@/types/document";


const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Types for AI analysis results
export interface ExtractedText {
  raw_text: string;
  structuredData: {
    personalInfo?: {
      name?: string;
      address?: string;
      ssn?: string;
    };
    accounts: Account[];
  };
}

export interface Account {
  name: string;
  status: string;
  dateOpened: string;
  balance: string;
  paymentHistory: string;
  isNegative?: boolean;
  reason?: string;
}

export interface DisputeAnalysis {
  negativeItems: Account[];
  recommendedDisputes: Account[];
  analysisNotes: string;
}

export interface GeneratedLetter {
  content: string;
  qualityScore: number;
  suggestions: string[];
}

export interface UserData {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  ssnLastFour?: string;
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
    items: NegativeItem[],
    bureau: string,
    userData: UserData,
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
  },

  async classifyTradeline(text: string): Promise<{ isNegative: boolean; reason: string }> {
    try {
      const content = await aiService.chatCompletion([
        { role: "system", content: "You are a credit analyzer. Given a single tradeline JSON as input, determine if the tradeline is negative. Respond with valid JSON { \"isNegative\": boolean, \"reason\": string } only." },
        { role: "user", content: text }
      ], "gpt-3.5-turbo-16k", 2048);
      return JSON.parse(content) as { isNegative: boolean; reason: string };
    } catch (err) {
      console.error("Error classifying tradeline:", err);
      return { isNegative: false, reason: "" };
    }
  },
  async ExtractedAccounts(ocrText: string): Promise<Account[]> {
    try {
      const content = await aiService.chatCompletion([
        { role: "system", content: "You are a JSON extractor. Given raw OCR text of credit tradelines, extract all accounts and return a JSON array of objects matching the Account interface: { name, status, dateOpened, balance, paymentHistory }." },
        { role: "user", content: ocrText }
      ], "gpt-3.5-turbo-16k", 2048);
      return JSON.parse(content) as Account[];
    } catch (err) {
      console.error("Error extracting accounts:", err);
      const accounts: Account[] = [];
      const accountMarkers = /Account Name|Status|Date Opened|Balance|Payment History/gim;
      const accountSegments = ocrText.split(accountMarkers);
      accountSegments.forEach(segment => {
        if (segment.trim() !== "") {
          const account: Account = {
            name: /Account Name:\s*(.*)/i.exec(segment)?.[1] || "",
            status: /Status:\s*(.*)/i.exec(segment)?.[1] || "",
            dateOpened: /Date Opened:\s*(.*)/i.exec(segment)?.[1] || "",
            balance: /Balance:\s*(.*)/i.exec(segment)?.[1] || "",
            paymentHistory: /Payment History:\s*(.*)/i.exec(segment)?.[1] || "",
          };
          accounts.push(account);
        }
      });
      return accounts;
    }
  },

  // General chat completion for chatbot widget
  async chatCompletion(messages: { role: "user" | "assistant" | "system"; content: string }[], model: string = "gpt-3.5-turbo-16k", maxTokens: number = 2048): Promise<string> {
    try {
      // Only send the last 10 messages to reduce token usage
      const contextMessages = messages.slice(-10);
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: contextMessages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      const data = await res.json();

      if (!res.ok) {
        // OpenAI API error, show message and log details
        console.error("OpenAI API error:", data);
        if (data && data.error && data.error.message) {
          return `OpenAI API error: ${data.error.message}`;
        }
        return "Sorry, I'm having trouble responding right now (OpenAI API error).";
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("OpenAI API returned unexpected response:", data);
        return "Sorry, I couldn't generate a response (unexpected API response).";
      }

      return data.choices[0].message.content as string;
    } catch (err) {
      console.error("Error in chatCompletion:", err);
      return "Sorry, I'm having trouble responding right now.";
    }
  }
};
