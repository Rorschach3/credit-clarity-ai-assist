// src/utils/tradelineParser.ts
import { sanitizeText } from "./ocr-parser";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { extractTradelineData } from "@/services/llm-parser";

// Type definitions for enum values
export type AccountType = "credit_card" | "loan" | "mortgage" | "auto_loan" | "student_loan" | "collection" | "";
export type AccountStatus = "open" | "closed" | "in_collection" | "charged_off" | "disputed" | "";
export type CreditBureau = "equifax" | "transunion" | "experian"; // Re-added CreditBureau type

// Enhanced Zod schema with better validation and error handling
export const ParsedTradelineSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  creditor_name: z.string().min(1).default(""),
  account_number: z.string().min(1).default(""),
  account_balance: z.string().default("$0"),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  credit_limit: z.string().default("$0"),
  monthly_payment: z.string().default("$0"),
  date_opened: z.string().default(""),
  is_negative: z.boolean().default(false),
  account_type: z.enum(["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", ""]).default("credit_card"),
  account_status: z.enum(["open", "closed", "in_collection", "charged_off", "disputed", ""]).default("open"),
  credit_bureau: z.enum(["equifax", "transunion", "experian"]).default("equifax"), // Re-added credit_bureau to schema
  dispute_count: z.number().int().min(0).default(0),
});

export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

// Enhanced parsing with better error handling and retry logic
export async function parseTradelinesFromText(
  text: string,
  userId: string, // Ensure userId is always provided and valid
  options: {
    maxRetries?: number;
    timeoutMs?: number;
    fallbackToBasicParsing?: boolean;
  } = {}
): Promise<ParsedTradeline[]> {
  const { maxRetries = 2, timeoutMs = 30000, fallbackToBasicParsing = true } = options;
  
  if (!text?.trim()) {
    console.warn("⚠️ Empty or invalid text provided for parsing");
    return [];
  }

  // More robust text splitting with multiple patterns
  const entries = sanitizeText(text)
    .split(/^(?=(?:CHASE|SCHOOLSFIRST|BANK OF AMERICA|CITIBANK|CAPITAL ONE|AMERICAN EXPRESS|AMEX|DISCOVER|WELLS FARGO|CAPITAL ONE N\.A\.)\b)/mi)
    .filter((e) => e.trim().length > 10); // Filter out very short entries

  if (entries.length === 0) {
    console.warn("⚠️ No valid tradeline entries found in text");
    return fallbackToBasicParsing ? [createFallbackTradeline(userId, ["No tradeline entries found"])] : [];
  }

  const parsedTradelines: ParsedTradeline[] = [];
  console.log(`📊 Processing ${entries.length} tradeline entries`);

  for (const [index, entry] of entries.entries()) {
    console.log(`🔄 Processing entry ${index + 1}/${entries.length}`);
    
    const result = await parseTradelineWithRetry(entry, userId, maxRetries, timeoutMs);
    if (result) {
      parsedTradelines.push(result);
    } else if (fallbackToBasicParsing) {
      // Create fallback tradeline with basic parsing
      const fallback = createFallbackTradeline(userId, [`Failed to parse entry ${index + 1}`], entry);
      parsedTradelines.push(fallback);
    }
  }

  console.log(`✅ Successfully parsed ${parsedTradelines.length} tradelines`);
  return parsedTradelines;
}

// Retry logic for individual tradeline parsing
async function parseTradelineWithRetry(
  entry: string, 
  userId: string, 
  maxRetries: number,
  timeoutMs: number
): Promise<ParsedTradeline | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for tradeline parsing`);
      
      // Add timeout to LLM call
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM parsing timeout')), timeoutMs);
      });
      
      const llmPromise = extractTradelineData(entry);
      const jsonResult = await Promise.race([llmPromise, timeoutPromise]);
      
      if (!jsonResult || typeof jsonResult !== 'string' || jsonResult.trim() === '') {
        throw new Error('LLM returned empty or invalid response');
      }

      // Parse and validate JSON response
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonResult);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from LLM: ${parseError.message}`);
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('LLM response is not a valid object');
      }

      // Enhanced data sanitization with confidence scoring
      const sanitizedParsed = sanitizeTradelineData(parsed, userId, entry);
      
      // Validate against schema
      const validatedTradeline = ParsedTradelineSchema.parse(sanitizedParsed);
      
      console.log(`✅ Successfully parsed tradeline on attempt ${attempt}`);
      return validatedTradeline;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      // Add exponential backoff for retries
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} attempts failed for tradeline parsing:`, lastError?.message);
  return null;
}

// Enhanced data sanitization with better defaults and validation
function sanitizeTradelineData(parsed: unknown, userId: string, originalText?: string): Partial<ParsedTradeline> {
  const warnings: string[] = [];
  let confidenceScore = 0.8; // Start with high confidence

  // Type guard to ensure parsed is an object
  if (!parsed || typeof parsed !== 'object') {
    return createFallbackData(userId, ["Invalid parsed data structure"]);
  }

  const parsedObj = parsed as Record<string, unknown>;

  // Helper function to safely extract and validate field
  const safeExtract = (field: string, defaultValue: string | number | boolean, validator?: (val: unknown) => boolean) => {
    const value = parsedObj[field];
    if (value === null || value === undefined || value === '') {
      warnings.push(`Missing ${field}, using default`);
      confidenceScore -= 0.1;
      return defaultValue;
    }
    if (validator && !validator(value)) {
      warnings.push(`Invalid ${field} format, using default`);
      confidenceScore -= 0.1;
      return defaultValue;
    }
    return value;
  };

  return {
    creditor_name: String(safeExtract('creditor_name', " ")),
    account_number: String(safeExtract('account_number', " ")),
    account_balance: String(safeExtract('account_balance', "$0")),
    created_at: new Date().toISOString(),
    credit_limit: String(safeExtract('credit_limit', "$0")),
    monthly_payment: String(safeExtract('monthly_payment', "$0")),
    date_opened: String(safeExtract('date_opened', " ")),
    is_negative: Boolean(safeExtract('is_negative', false)),
    account_type: validateAccountType(parsedObj.account_type) || "credit_card",
    account_status: validateAccountStatus(parsedObj.account_status) || "open",
    credit_bureau: validateCreditBureau(parsedObj.credit_bureau) || "equifax", // Re-added credit_bureau
    user_id: userId,
    dispute_count: Number(safeExtract('dispute_count', 0)) || 0,
  };
}

// Helper function to create fallback data structure
function createFallbackData(userId: string, warnings: string[]): Partial<ParsedTradeline> {
  return {
    creditor_name: "Unknown Creditor",
    account_number: "Parse Failed",
    account_balance: "$0",
    created_at: new Date().toISOString(),
    credit_limit: "$0",
    monthly_payment: "$0",
    date_opened: "Unknown",
    is_negative: false,
    account_type: "credit_card" as AccountType,
    account_status: "open" as AccountStatus,
    credit_bureau: "equifax" as CreditBureau, // Re-added credit_bureau
    user_id: userId,
    dispute_count: 0,
  };
}

// Create fallback tradeline when parsing fails
function createFallbackTradeline(userId: string, warnings: string[] = [], originalText?: string): ParsedTradeline {
  let creditorName = "Unknown Creditor";
  
  // Try to extract creditor name from original text if available
  if (originalText) {
    const creditorMatch = originalText.match(/^([A-Z\s&.]+)/);
    if (creditorMatch) {
      creditorName = creditorMatch[1].trim();
    }
  }

  return ParsedTradelineSchema.parse({
    creditor_name: creditorName,
    account_number: "Parse Failed",
    account_balance: "$0",
    created_at: new Date().toISOString(),
    credit_limit: "$0",
    monthly_payment: "$0",
    date_opened: "Unknown",
    is_negative: false,
    account_type: "credit_card" as AccountType,
    account_status: "open" as AccountStatus,
    credit_bureau: "equifax" as CreditBureau, // Re-added credit_bureau
    user_id: userId,
    dispute_count: 0,
  });
}

// Supabase-generated types for tradelines table
type TradelineInsert = Database["public"]["Tables"]["tradelines"]["Insert"];
type TradelineRow = Database["public"]["Tables"]["tradelines"]["Row"];

// Enhanced database save with better error handling
export const saveTradelinesToDatabase = async (tradelines: ParsedTradeline[], userId: string) => {
  try {
    console.log("Saving tradelines via Edge Function:", { count: tradelines.length, userId });

    const response = await fetch('https://gywohmbqohytziwsjrps.supabase.co/functions/v1/add-tradeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Accessing client-side env var via Vite
      },
      body: JSON.stringify({ tradelines: tradelines.map(tl => ({ ...tl, user_id: userId })) }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Edge Function error:", errorData);
      throw new Error(`Failed to save tradelines via Edge Function: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log("Save successful via Edge Function:", result);
    return result;
  } catch (error) {
    console.error("Error in saveTradelinesToDatabase (Edge Function call):", error);
    throw error;
  }
};

// Add logging to your fetch function
export const fetchUserTradelines = async (user_id: string): Promise<ParsedTradeline[]> => {
  try {
    console.log("Fetching tradelines for user:", user_id);
    
    const { data, error } = await supabase
      .from('tradelines')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      console.error("Database fetch error:", error);
      throw error;
    }
    
    console.log("Fetch successful:", { count: data?.length || 0, data });
    // Validate and transform fetched data to ParsedTradeline schema
    return data ? data.map(item => ParsedTradelineSchema.parse(item)) : [];
  } catch (error) {
    console.error("Error in fetchUserTradelines:", error);
    throw error;
  }
};

// Enhanced validation functions with better type safety
function validateAccountType(type: unknown): AccountType | undefined {
  if (!type || typeof type !== 'string') return undefined;
  const validTypes: AccountType[] = ["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", ""];
  const normalizedType = type.toLowerCase().replace(/[_\s]/g, '_') as AccountType;
  return validTypes.includes(normalizedType) ? normalizedType : undefined;
}

function validateAccountStatus(status: unknown): AccountStatus | undefined {
  if (!status || typeof status !== 'string') return undefined;
  const validStatuses: AccountStatus[] = ["open", "closed", "in_collection", "charged_off", "disputed", ""];
  const normalizedStatus = status.toLowerCase().replace(/\s/g, '_') as AccountStatus;
  return validStatuses.includes(normalizedStatus) ? normalizedStatus : undefined;
}

function validateCreditBureau(bureau: unknown): CreditBureau | undefined {
  if (!bureau || typeof bureau !== 'string') return undefined;
  const validBureaus: CreditBureau[] = ["equifax", "transunion", "experian"];
  const normalizedBureau = bureau.toLowerCase() as CreditBureau;
  return validBureaus.includes(normalizedBureau) ? normalizedBureau : undefined;
}
