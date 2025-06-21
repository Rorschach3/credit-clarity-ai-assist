// src/utils/tradelineParser.ts
import { sanitizeText } from "./ocr-parser";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { extractTradelineData } from "@/services/llm-parser";

// Type definitions for enum values
export type AccountType = "credit_card" | "loan" | "mortgage" | "auto_loan" | "student_loan" | "collection";
export type AccountStatus = "open" | "closed" | "in_collection" | "charged_off" | "disputed";
export type CreditBureau = "equifax" | "transunion" | "experian";

// Zod schema for individual parsed tradeline
export const ParsedTradelineSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  creditor_name: z.string().nullable().transform((val) => val || "Unknown"),
  account_number: z.string().nullable().transform((val) => val || "Unknown"),
  account_balance: z.string().nullable().transform((val) => val || "0"),
  created_at: z.string().transform((str) => (str ? str : new Date().toISOString())),
  credit_limit: z.string().nullable().transform((val) => val || "0"),
  monthly_payment: z.string().nullable().transform((val) => val || "0"),
  date_opened: z.string().nullable().transform((val) => val || "Unknown"),
  is_negative: z.boolean().default(false),
  account_type: z.enum(["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection"]).default("credit_card"),
  account_status: z.enum(["open", "closed", "in_collection", "charged_off", "disputed"]).default("open"),
  credit_bureau: z.enum(["equifax", "transunion", "experian"]).default("equifax"),
  raw_text: z.string().default(""),
  dispute_count: z.number().optional().default(0),
});

export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

export async function parseTradelinesFromText(text: string, userId: string): Promise<ParsedTradeline[]> {
  const entries = sanitizeText(text)
    .split(/^(?=CHASE|SCHOOLSFIRST|BANK OF AMERICA|CITIBANK|CAPITAL ONE|AMERICAN EXPRESS|AMEX|DISCOVER|WELLS FARGO|CAPITAL ONE N\.A\.)/mi)
    .filter((e) => e.trim());

  const parsedTradelines: ParsedTradeline[] = [];

  for (const entry of entries) {
    try {
      // Use the standalone function instead of class method
      const jsonResult = await extractTradelineData(entry);
      const parsed = JSON.parse(jsonResult);

      // Ensure all required fields have fallback values
      const sanitizedParsed = {
        creditor_name: parsed.creditor_name || "Unknown",
        account_number: parsed.account_number || "Unknown",
        account_balance: parsed.account_balance || "0",
        created_at: parsed.created_at || new Date().toISOString(),
        credit_limit: parsed.credit_limit || "0",
        monthly_payment: parsed.monthly_payment || "0",
        date_opened: parsed.date_opened || "Unknown",
        is_negative: Boolean(parsed.is_negative),
        account_type: parsed.account_type || "credit_card",
        account_status: parsed.account_status || "open",
        credit_bureau: parsed.credit_bureau || "equifax",
        raw_text: parsed.raw_text || entry,
        user_id: userId,
        dispute_count: parsed.dispute_count || 0,
      };

      parsedTradelines.push(ParsedTradelineSchema.parse(sanitizedParsed));
    } catch (error) {
      console.error("❌ Error parsing tradeline entry:", entry);
      console.error("↪️ Reason:", error);
      
      // Add a fallback tradeline with basic info
      try {
        const fallbackTradeline = {
          creditor_name: "Parse Error",
          account_number: "Unknown",
          account_balance: "0",
          created_at: new Date().toISOString(),
          credit_limit: "0",
          monthly_payment: "0",
          date_opened: "Unknown",
          is_negative: false,
          account_type: "credit_card" as AccountType,
          account_status: "open" as AccountStatus,
          credit_bureau: "equifax" as CreditBureau,
          raw_text: entry,
          user_id: userId,
          dispute_count: 0,
        };
        
        parsedTradelines.push(ParsedTradelineSchema.parse(fallbackTradeline));
      } catch (fallbackError) {
        console.error("❌ Even fallback parsing failed:", fallbackError);
      }
    }
  }

  return parsedTradelines;
}

// Supabase-generated types for tradelines table
type TradelineInsert = Database["public"]["Tables"]["tradelines"]["Insert"];
type TradelineRow = Database["public"]["Tables"]["tradelines"]["Row"];

export async function saveTradelinesToDatabase(
  tradelines: ParsedTradeline[],
  userId: string
): Promise<void> {
  if (!tradelines.length) return;

  const rows: TradelineInsert[] = tradelines.map((tradeline) => ({
    user_id: tradeline.user_id || userId,
    creditor_name: tradeline.creditor_name,
    account_number: tradeline.account_number,
    account_balance: typeof tradeline.account_balance === 'number' ? String(tradeline.account_balance) : tradeline.account_balance,
    credit_limit: typeof tradeline.credit_limit === 'number' ? String(tradeline.credit_limit) : tradeline.credit_limit,
    date_opened: tradeline.date_opened,
    is_negative: tradeline.is_negative,
    raw_text: tradeline.raw_text,
    account_type: tradeline.account_type,
    account_status: tradeline.account_status,
    credit_bureau: tradeline.credit_bureau,
    monthly_payment: tradeline.monthly_payment,
  }));

  console.log("Using API key for Supabase operations.");
  console.log("Inserting tradelines:", rows);
  console.time("Tradeline Upsert");

  const { error } = await supabase.from("tradelines").upsert(rows);

  console.timeEnd("Tradeline Upsert");

  if (error) {
    console.error("Error inserting tradelines. Rows:", rows, "Error:", error);
    throw new Error(`Supabase tradeline upsert failed: ${error.message}`);
  }
}

export async function fetchUserTradelines(userId: string): Promise<ParsedTradeline[]> {
  const { data, error } = await supabase
    .from("tradelines")
    .select("*")
    .eq("user_id", userId);
    
  if (error) throw error;
  if (!data) return [];

  return data.map((row: TradelineRow) => {
    // Validate account_type against allowed values
    const accountType = validateAccountType(row.account_type);
    const accountStatus = validateAccountStatus(row.account_status);
    
    return {
      id: row.id,
      user_id: row.user_id,
      creditor_name: row.creditor_name,
      account_number: row.account_number,
      account_status: accountStatus || "open", // Provide fallback
      account_type: accountType || "credit_card", // Provide fallback
      account_balance: row.account_balance,
      credit_limit: row.credit_limit,
      date_opened: row.date_opened,
      is_negative: Boolean(row.is_negative),
      raw_text: row.raw_text,
      created_at: row.created_at,
      credit_bureau: validateCreditBureau(row.credit_bureau),
      monthly_payment: row.monthly_payment,
      dispute_count: Number(row.dispute_count || 0)
    };
  });
}

// Helper validation functions with proper type guards
function validateAccountType(type: string | null | undefined): AccountType | undefined {
  if (!type) return undefined;
  const validTypes: AccountType[] = ["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection"];
  const lowerType = type.toLowerCase();
  return validTypes.find(validType => validType === lowerType) || undefined;
}

function validateAccountStatus(status: string | null | undefined): AccountStatus | undefined {
  if (!status) return undefined;
  const validStatuses: AccountStatus[] = ["open", "closed", "in_collection", "charged_off", "disputed"];
  const lowerStatus = status.toLowerCase();
  return validStatuses.find(validStatus => validStatus === lowerStatus) || undefined;
}

function validateCreditBureau(bureau: string | null | undefined): CreditBureau {
  if (!bureau) return "equifax";
  const validBureaus: CreditBureau[] = ["equifax", "transunion", "experian"];
  const lowerBureau = bureau.toLowerCase();
  return validBureaus.find(validBureau => validBureau === lowerBureau) || "equifax";
}