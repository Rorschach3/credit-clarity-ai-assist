// src/utils/tradelineParser.ts
import { sanitizeText } from "./ocr-parser";
import { z } from "zod";
import { standardizeCreditorName } from "./creditorMatching";
import { v4 as uuidv4 } from 'uuid';

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Zod schema for individual parsed tradeline
export const ParsedTradelineSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  creditor_name: z.string().optional(),
  account_number: z.string().optional(),
  account_status: z.string().optional(),
  account_type: z.string().optional(),
  account_balance: z.union([z.string(), z.number(), z.null()]).default(""),
  credit_limit: z.union([z.string(), z.number(), z.null()]).default(""),
  date_opened: z.string().optional(),
  is_negative: z.boolean().optional().default(false),
  raw_text: z.string().optional(),
  monthly_payment: z.string().optional(),
  dispute_count: z.number().optional().default(0),
  credit_bureau: z.string().optional(),
  // created_at: z.string().optional().default(new Date().toISOString()),
});
export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

const accountNumberRegexes = [
  /Account\s+[+:]?\s*(\d{4,}[XxXx]*)/i,
  /Account Number\s*[:#]?\s*(\d{4,}[XxXx]*)/i,
  /\b(\d{4,})(?:X{2,}|\*+)?\b/,
  /Acct\s*#[: ]*\s*(\d{4,}[XxXx]*)/i,
];

const statusKeywords = {
  chargedOff: /charged off/i,
  collection: /sent to collections|in collection/i,
  closed: /account closed/i,
  paid: /paid in full/i,
  open: /open account|current/i,
};

const negativeRegex = /collection|charge.?off|late/i;

/**
 * Parse raw OCR/text into an array of validated ParsedTradeline objects
 */
export function parseTradelinesFromText(text: string): ParsedTradeline[] {
  const entries = sanitizeText(text)
    .split(/^(?=CHASE|SCHOOLSFIRST|BANK OF AMERICA|CITIBANK|CAPITAL ONE|AMERICAN EXPRESS|AMEX|DISCOVER|WELLS FARGO|CAPITAL ONE N\.A\.)/mi)
    .filter((e) => e.trim());

  return entries.map((entry) => {
    const rawCreditorName = entry.match(/^(.*?)(?:\n|Account Number:|Status:)/i)?.[1]?.trim() ?? "Unknown";
    const creditorName = standardizeCreditorName(rawCreditorName);

    let accountNumber = "N/A";
    for (const rx of accountNumberRegexes) {
      const m = entry.match(rx);
      if (m?.[1]) {
        accountNumber = m[1].trim();
        break;
      }
    }

    const detected = Object.entries(statusKeywords).find(([, rx]) => rx.test(entry));
    const accountStatus = detected?.[0] ?? "Unknown";

    const isNegative = negativeRegex.test(entry) || negativeRegex.test(accountStatus);

    const balanceMatch = entry.match(/Balance:?\s*\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/);
    const accountBalance = balanceMatch ? balanceMatch[1].trim() : null;

    const clMatch = entry.match(/Credit Limit:?\s*\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/);
    const creditLimit = clMatch ? clMatch[1].trim() : null;

    const dateOpenedMatch = entry.match(/Date Opened:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateOpened = dateOpenedMatch?.[1] ?? "";

    return ParsedTradelineSchema.parse({
      user_id: undefined,
      creditor_name: creditorName,
      account_number: accountNumber,
      account_status: detected?.[0] ?? undefined,
      account_type: undefined,
      account_balance: accountBalance,
      credit_limit: creditLimit,
      date_opened: dateOpened,
      is_negative: isNegative,
      raw_text: entry.trim(),
      monthly_payment: undefined,
      credit_bureau: undefined,
      created_at: new Date().toISOString(),
    });
  });
}
// Supabase-generated types for tradelines table
type TradelineInsert = Database["public"]["Tables"]["tradelines"]["Insert"];
type TradelineRow = Database["public"]["Tables"]["tradelines"]["Row"];

/**
 * Persist parsed tradelines into Supabase `tradelines` table
 */
export async function saveTradelinesToDatabase(
  tradelines: ParsedTradeline[],
  userId: string
): Promise<void> {
  if (!tradelines.length) return;

  const rows: TradelineInsert[] = tradelines.map((t) => ({
    id: uuidv4(),
    user_id: userId,
    creditor_name: t.creditor_name || null,
    account_number: t.account_number || null,
    account_status: t.account_status || null,
    account_type: t.account_type || null,
    account_balance: t.account_balance ?? null,
    credit_limit: t.credit_limit ?? null,
    date_opened: t.date_opened || null,
    is_negative: t.is_negative ?? null,
    raw_text: t.raw_text,
    created_at: new Date().toISOString(),
    dispute_count: t.dispute_count ?? 0,
    monthly_payment: t.monthly_payment ?? null,
    credit_bureau: t.credit_bureau ?? null
  }));

  console.log("Inserting tradelines:", rows);
  const { error } = await supabase
    .from("tradelines")
    .upsert(rows, { onConflict: "user_id,account_number" });

  if (error) {
    console.error("Error inserting tradelines:", error);
    throw error;
  }
}

/**
 * Fetch tradelines for a given user from Supabase
 */
export async function fetchUserTradelines(
  userId: string
): Promise<ParsedTradeline[]> {
  const { data, error } = await supabase
    .from("tradelines")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  if (!data) return [];

  return data.map((row) =>
    ParsedTradelineSchema.parse({
      creditorName: row.creditor_name,
      accountNumber: row.account_number,
      accountStatus: row.account_status,
      accountType: row.account_type,
      accountBalance: row.account_balance,
      creditLimit: row.credit_limit,
      dateOpened: row.date_opened,
      isNegative: row.is_negative,
      rawText: row.raw_text
    })
  );
}

