// src/utils/tradelineParser.ts
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client"; // Ensure supabase client is imported
// Import the new function from the LLM service
import { extractAllTradelines } from "@/services/llm-parser";
import { format, parseISO, isValid } from "date-fns";
import { v4 as uuidv4 } from "uuid"; // Add this import

// Type definitions for enum values
export type AccountType = "credit_card" | "loan" | "mortgage" | "auto_loan" | "student_loan" | "collection" | "other" | "";
export type AccountStatus = "open" | "closed" | "in_collection" | "charged_off" | "disputed" | "other" | "";
export type CreditBureau = "equifax" | "transunion" | "experian" | "";

// Enhanced Zod schema with better validation and error handling
// NOTE: This schema should match the expected JSON structure from the LLM
export const ParsedTradelineSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()), // Default to generating UUID if not provided
  user_id: z.string().uuid(), // user_id is now required
  creditor_name: z.string().default(""),
  account_number: z.string().default(""),
  account_balance: z.string().default("$0"),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  credit_limit: z.string().default("$0"),
  monthly_payment: z.string().default("$0"),
  date_opened: z.string().nullable().default(null),
  is_negative: z.boolean().default(false),
  account_type: z.enum(["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", "other", ""]).default("other"),
  account_status: z.enum(["open", "closed", "in_collection", "charged_off", "disputed", "other", ""]).default("other"),
  credit_bureau: z.enum(["equifax", "transunion", "experian", ""]).default(""),
  dispute_count: z.number().int().min(0).default(0),
  rawText: z.string().default(""),
});

export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

// Primary function to parse tradelines using the LLM service
export async function parseTradelinesFromText(
  text: string,
  userId: string,
  options: {
    documentId?: string; // Pass documentId to LLM service
    onChunk?: (chunk: string) => void; // Pass onChunk to LLM service
    fallbackToBasicParsing?: boolean; // Keep fallback option if needed
  } = {}
): Promise<ParsedTradeline[]> {
  // IMMEDIATE FIX: Reject PDF data - This should ideally be handled before getting text
  if (text.startsWith('data:application/pdf;base64,')) {
    throw new Error("PDF files must be converted to text before processing. Please extract text from PDF first.");
  }

  // IMMEDIATE FIX: Limit text size - LLM service might handle this, but good to have a check
  const maxTextLength = 100000; // Adjust based on your LLM's limits and testing
  if (text.length > maxTextLength) {
    console.warn(`⚠️ Text too long for optimal LLM processing (${text.length} chars). Truncating.`);
    text = text.substring(0, maxTextLength); // Truncate if necessary
  }

  const { documentId, onChunk, fallbackToBasicParsing = true } = options;

  if (!text?.trim()) {
    console.warn("⚠️ Empty or invalid text provided for parsing");
    return [];
  }

  try {
    // Use the LLM service to extract ALL tradelines from the full text
    const parsedTradelines = await extractAllTradelines(text, documentId, onChunk);

    console.log(`✅ Successfully parsed ${parsedTradelines.length} tradelines using LLM`);

    // Validate and add user_id and UUIDs if not already present
    const finalTradelines = parsedTradelines.map(tl => {
      try {
        // Use Zod schema to validate and provide defaults/coercion
        return ParsedTradelineSchema.parse({
          ...tl,
          user_id: userId, // Ensure user_id is set
          id: tl.id || uuidv4(), // Ensure ID is present
          // Apply formatTradelineDate if needed, though LLM should ideally format
          date_opened: tl.date_opened ? formatTradelineDate(tl.date_opened) : null,
          account_type: validateAccountType(tl.account_type) || "other",
          account_status: validateAccountStatus(tl.account_status) || "other",
          credit_bureau: validateCreditBureau(tl.credit_bureau) || "",
        });
      } catch (e) {
        console.error(`⚠️ Zod validation failed for tradeline item:`, e);
        console.log(`Problematic item:`, tl);
        // Return a fallback or skip the invalid item
        return createFallbackTradeline(userId, [`Zod validation failed for item`], JSON.stringify(tl));
      }
    });

    return finalTradelines;

  } catch (error) {
    console.error("❌ LLM tradeline extraction failed:", error);

    if (fallbackToBasicParsing) {
      console.warn("⚠️ Falling back to basic tradeline parsing.");
      // Reimplement or adapt basic parsing if necessary, or create a simple fallback
      // For now, creating a single fallback entry.
      return [createFallbackTradeline(userId, ["LLM extraction failed, using fallback."], text)];
    }

    throw error; // Re-throw if no fallback
  }
}

// Helper to format date to yyyy-MM-dd, handling invalid day (e.g., '00')
function formatTradelineDate(dateInput: unknown): string | null {
  if (typeof dateInput !== 'string' || !dateInput.trim()) {
    return null; // Return null if date is not available or empty
  }

  const dateString = dateInput.trim();
  let parsedDate: Date;

  // Check for YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, 'MM/dd/yyyy'); // Format as MM/DD/YYYY
    }
  }

  // Check for YYYY-MM-00 or YYYY-MM (missing day)
  if (/^\d{4}-\d{2}(-00)?$/.test(dateString)) {
    // If it's YYYY-MM-00, replace 00 with 01 for parsing, but treat as month-year only
    const yearMonth = dateString.substring(0, 7);
    parsedDate = parseISO(`${yearMonth}-01`); // Add '01' as day for parsing
    if (isValid(parsedDate)) {
      return format(parsedDate, 'MM/yyyy'); // Format as MM/YYYY
    }
  }
   // Check for MM/DD/YYYY format
   if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    // It's already in the target format
    return dateString;
  }
   // Check for MM/YYYY format
   if (/^\d{2}\/\d{4}$/.test(dateString)) {
    // It's already in the target format
    return dateString;
  }


  console.warn(`⚠️ Could not parse or format date: ${dateInput}. Returning null.`);
  return null; // Return null if date cannot be parsed into a valid format
}

// Helper function to create fallback data structure
// This is now primarily used for fallback scenarios when LLM fails or Zod validation fails
function createFallbackData(userId: string, warnings: string[]): Partial<ParsedTradeline> {
  console.warn("⚠️ Creating fallback data structure. Warnings:", warnings);
  return {
    creditor_name: "Parsing Failed",
    account_number: "Unknown",
    account_balance: "$0",
    created_at: new Date().toISOString(),
    credit_limit: "$0",
    monthly_payment: "$0",
    date_opened: null,
    is_negative: false, // Assume not negative if parsing failed
    account_type: "other",
    account_status: "other",
    credit_bureau: "",
    dispute_count: 0,
    rawText: "",
    user_id: userId,
  };
}

// Create fallback tradeline when parsing fails
// This is now primarily used when the main LLM extraction fails
function createFallbackTradeline(userId: string, warnings: string[] = [], originalText?: string): ParsedTradeline {
  console.warn("⚠️ Creating fallback tradeline due to parsing failure. Warnings:", warnings);
  let creditorName = "Parsing Failed";

  // Try to extract creditor name from original text if available
  if (originalText) {
     // Basic attempt to get the first line as potential creditor name
    const lines = originalText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 0) {
        creditorName = lines[0];
    }
  }

  return ParsedTradelineSchema.parse({
    id: uuidv4(), // Generate UUID here
    creditor_name: creditorName,
    account_number: "Unknown",
    account_balance: "$0",
    created_at: new Date().toISOString(),
    credit_limit: "$0",
    monthly_payment: "$0",
    date_opened: null,
    is_negative: false,
    account_type: "other",
    account_status: "other",
    credit_bureau: "",
    user_id: userId,
    dispute_count: 0,
    rawText: originalText || "",
  });
}

const uuidSchema = z.string().uuid();

// Enhanced database save with better error handling
export async function saveTradelinesToDatabase(tradelines: ParsedTradeline[], userId: string) {
  if (!uuidSchema.safeParse(userId).success) {
    console.error("❌ Invalid user_id provided:", userId);
    return;
  }

  // Filter out any potentially invalid tradelines before saving
  const validTradelines = tradelines.filter(tl => ParsedTradelineSchema.safeParse(tl).success);

  if (validTradelines.length === 0) {
      console.warn("⚠️ No valid tradelines to save to database.");
      return;
  }


  try {
    console.log('Saving tradelines to database:', validTradelines);
    console.log("Attempting to save tradelines via Edge Function:", { count: validTradelines.length, userId });

    const tradelinesForDb = validTradelines.map(tl => {
      const { id, ...tradelineWithoutId } = tl;
      return {
        ...tradelineWithoutId,
        user_id: userId
      };
    });

    const payload = { tradelines: tradelinesForDb };
    console.log("Payload sent to Edge Function:", JSON.stringify(payload, null, 2));

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("Authentication error: No active session found.", sessionError);
      throw new Error("Authentication required to save tradelines.");
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("VITE_SUPABASE_URL is not defined in environment variables.");
    }
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/add-tradeline`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // Use authenticated user's token
      },
      body: JSON.stringify(payload), // payload already contains user_id
    });

    console.log(`Edge Function response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Edge Function error response body:", errorData);
      throw new Error(`Failed to save tradelines via Edge Function: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log("Tradeline save successful via Edge Function:", result);
    return result;
  } catch (error) {
    console.error("Error in saveTradelinesToDatabase (Edge Function call):", error);
    throw error;
  }
}

// Add logging to your fetch function
export const fetchUserTradelines = async (user_id: string): Promise<ParsedTradeline[]> => {
  try {
    console.log("Fetching tradelines for user:", user_id);

    // Verify user authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Authentication error:", authError);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (user.id !== user_id) {
      throw new Error("User ID mismatch - unauthorized access");
    }

    const { data, error } = await supabase
      .from('tradelines')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      console.error("Database fetch error:", error);
      throw error;
    }

    console.log("Fetch successful:", { count: data?.length || 0 });
    return data ? data.map(item => ParsedTradelineSchema.parse(item)) : [];
  } catch (error) {
    console.error("Error in fetchUserTradelines:", error);
    throw error;
  }
};

// Enhanced validation functions with better type safety
export function validateAccountType(type: unknown): AccountType | undefined {
  if (!type || typeof type !== 'string') return undefined;
  const validTypes: AccountType[] = ["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", "other", ""];
  const normalizedType = type.toLowerCase().replace(/[_\s]/g, '_') as AccountType;
  return validTypes.includes(normalizedType) ? normalizedType : undefined;
}

export function validateAccountStatus(status: unknown): AccountStatus | undefined {
  if (!status || typeof status !== 'string') return undefined;
  const validStatuses: AccountStatus[] = ["open", "closed", "in_collection", "charged_off", "disputed", "other", ""];
  const normalizedStatus = status.toLowerCase().replace(/\s/g, '_') as AccountStatus;
  return validStatuses.includes(normalizedStatus) ? normalizedStatus : undefined;
}

function validateCreditBureau(bureau: unknown): CreditBureau | undefined {
  if (!bureau || typeof bureau !== 'string') return undefined;
  const validBureaus: CreditBureau[] = ["equifax", "transunion", "experian", ""];
  const normalizedBureau = bureau.toLowerCase() as CreditBureau;
  return validBureaus.includes(normalizedBureau) ? normalizedBureau : undefined;
}