import { sanitizeText } from "./ocr-parser";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const ParsedTradelineSchema = z.object({
  creditorName: z.string(),
  accountNumber: z.string(),
  status: z.string(),
  isNegative: z.boolean(),
  negativeReason: z.string().nullable().optional(),
  balance: z.number(),
  dateOpened: z.string().nullable(),
  rawText: z.string(),
});

export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

// Define interface for Supabase tradeline table row based on error feedback
interface TradelineDbRow {
  id?: string; // Assuming id is optional and auto-generated
  user_id: string;
  creditor: string;
  account_number: string;
  status: string;
  type: string | null; // Assuming type can be null
  balance: number;
  date_opened: string | null; // Assuming date_opened can be null
  credit_line: number | null; // Assuming credit_line can be null
  monthly_payment: number | null; // Assuming monthly_payment can be null
  account_condition: string | null; // Assuming account_condition can be null
  // Removed negative_reason, is_negative, raw_text based on TypeScript error
  created_at?: string; // Assuming created_at is optional and auto-generated
  credit_bureau?: string; // Assuming credit_bureau is optional
  raw_text?: string; // Assuming raw_text is optional, used for storing original text
}


const accountNumberRegexes = [
  /Account\s+[+:]?\s*(\d{4,}[XxXx]*)/i,
  /Account Number\s*[:#]?\s*(\d{4,}[XxXx]*)/i,
  /\b(\d{4,})(?:X{2,}|\*+)?\b/, // catch partials
  /Acct\s*#[: ]*\s*(\d{4,}[XxXx]*)/i
];

const statusKeywords = {
  chargedOff: /charged off/i,
  collection: /sent to collections|in collection/i,
  closed: /account closed/i,
  paid: /paid in full/i,
  open: /open account|current/i
};

const negativeRegex = /collection|charge.?off|late/i;

export const parseTradelinesFromText = (text: string): ParsedTradeline[] => {
  const tradelines: ParsedTradeline[] = [];
  const sanitizedText = sanitizeText(text);

  // Improved regex to split tradelines based on common patterns at the beginning of a line
  const entries = sanitizedText.split(/^(?=CHASE CARD|SCHOOLSFIRST|BANK OF AMERICA|CITIBANK|CAPITAL ONE|AMEX|DISCOVER|WELLS FARGO|CAPITAL ONE N.A.)/mi);

  for (const entry of entries) {
    if (entry.trim() === '') continue; // Skip empty entries

    // Extract creditor name, allowing for more variations
    const creditorName = entry.match(/^(.*?)(?:\n|Account Number:|Status:)/i)?.[1]?.trim() || 'Unknown';

    let accountNumber = 'N/A';
    for (const regex of accountNumberRegexes) {
      const match = entry.match(regex);
      if (match && match[1]) {
        accountNumber = match[1].replace(/\s/g, '').trim();
        break;
      }
    }

    let status: string = 'Unknown';
    let negativeReason: string | undefined;

    // Auto-detect status
    const detectedStatus = Object.entries(statusKeywords).find(([, regex]) => regex.test(entry));
    if (detectedStatus) {
      status = detectedStatus[0];
    }

    // Infer "Negative" from reason or status
    const isNegative = negativeRegex.test(entry) || negativeRegex.test(status);
    if (isNegative) {
      const matchedNegativeReason = negativeRegex.exec(entry)?.[0] || negativeRegex.exec(status)?.[0];
      if (matchedNegativeReason) {
        negativeReason = matchedNegativeReason;
      }
    }

    // Extract balance
    const balanceMatch = entry.match(/Balance:\s*\$?([\d,]+\.?\d{0,2})/i);
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;

    // Extract date opened
    const dateOpenedMatch = entry.match(/Date Opened:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateOpened = dateOpenedMatch ? dateOpenedMatch[1] : null;

    tradelines.push({
      creditorName,
      accountNumber,
      status,
      isNegative,
      negativeReason,
      balance,
      dateOpened,
      rawText: entry.trim(),
    });
  }

  return tradelines;
};

export async function fetchUserTradelines(userId: string): Promise<ParsedTradeline[]> {
  const { data, error } = await supabase
    .from("tradelines")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch tradelines: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Map database rows to ParsedTradeline type, handling potential missing fields
  return data.map((row: TradelineDbRow) => ({
    creditorName: row.creditor,
    accountNumber: row.account_number,
    status: row.status,
    // Infer isNegative and negativeReason if not directly available
    isNegative: row.status ? negativeRegex.test(row.status) : false,
    negativeReason: row.status ? negativeRegex.exec(row.status)?.[0] || null : null,
    balance: row.balance,
    dateOpened: row.date_opened,
    rawText: JSON.stringify(row), // Store the whole row as raw text if original raw_text is missing
  }));
}

export async function saveTradelinesToDatabase(tradelines: ParsedTradeline[], userId: string): Promise<void> {
  if (tradelines.length === 0) return;

  // Map ParsedTradeline to database row format with correct keys and types
  const dbRows: TradelineDbRow[] = tradelines.map((t) => ({
    user_id: userId,
    creditor: t.creditorName,
    account_number: t.accountNumber,
    status: t.status,
    type: "", // Assuming type is a string, adjust if needed
    balance: t.balance,
    date_opened: t.dateOpened,
    credit_line: null, // Assuming nullable
    monthly_payment: null, // Assuming nullable
    account_condition: null, // Assuming nullable
    // Do not include negative_reason, is_negative, raw_text if they are not in the DB schema
    // negative_reason: t.negativeReason,
    // is_negative: t.isNegative,
    // raw_text: t.rawText,
  }));

  const { error } = await supabase.from("tradelines").upsert(dbRows, { onConflict: "user_id,account_number" });

  if (error) {
    throw new Error(`Failed to save tradelines: ${error.message}`);
  }
}
