import { sanitizeText } from "./ocr-parser";
import { supabase } from "../../supabase/client";
import { z } from "zod";

// Zod schema for a parsed tradeline
export const ParsedTradelineSchema = z.object({
  id: z.string().optional(),
  creditorName: z.string().min(2, { message: "Creditor name must be at least 2 characters." }),
  accountNumber: z.string().min(4, { message: "Account number must be at least 4 characters." }),
  accountName: z.string().min(2, { message: "Account name must be at least 2 characters." }), // Ensure accountName is required
  accountStatus: z.string().min(2, { message: "Status must be at least 2 characters." }),
  isNegative: z.boolean(),
  accountBalance: z.string().nullable().default("0"),
  dateOpened: z.string().nullable(),
  negativeReason: z.string().nullable().optional(),
  accountType: z.string().nullable().optional(),
  creditLimit: z.string().nullable().optional().default("0"),
  monthlyPayment: z.string().nullable().optional().default("0"),
  creditBureau: z.string().nullable(),
  disputeCount: z.number().default(0)
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

export const parseTradelinesFromText = (
  text: string,
): { valid: ParsedTradeline[]; rejected: { entry: string; errors: z.ZodIssue[] }[] } => {
  const valid: ParsedTradeline[] = [];
  const rejected: { entry: string; errors: z.ZodIssue[] }[] = [];
  const sanitized = sanitizeText(text);

  const entries = sanitized.split(
    /^(?=CHASE CARD|SCHOOLSFIRST|BANK OF AMERICA|CITIBANK|CAPITAL ONE|AMEX|DISCOVER|WELLS FARGO|CLIMB CREDIT|CAPITAL ONE N\.A\.)/gim,
  );

  for (const entry of entries) {
    if (!entry.trim()) continue;

    const creditorName = entry.match(/^(.*?)(?:\n|Account Number:|Status:)/i)?.[1]?.trim() || "Unknown";
    let accountNumber = "N/A";
    for (const rx of accountNumberRegexes) {
      const match = entry.match(rx);
      if (match?.[1]) {
        accountNumber = match[1].replace(/\s/g, "");
        break;
      }
    }
    let accountStatus = "Unknown";
    const detected = Object.entries(statusKeywords).find(([, rx]) => rx.test(entry));
    if (detected) accountStatus = detected[0];

    const isNegative = negativeRegex.test(entry) || negativeRegex.test(accountStatus);
    const negativeReason = negativeRegex.exec(entry)?.[0] ?? negativeRegex.exec(accountStatus)?.[0] ?? null;

    const balanceMatch = entry.match(/Balance:\s*\$?([\d,]+\.?\d{0,2})/i);
    const accountBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")).toString() : "0";

    const dateMatch = entry.match(/Date Opened:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateOpened = dateMatch?.[1] ?? null;

    const creditBureau = /Experian/i.test(entry)
      ? "Experian"
      : /TransUnion/i.test(entry)
      ? "TransUnion"
      : /Equifax/i.test(entry)
      ? "Equifax"
      : null;

    const tradeline: Omit<ParsedTradeline, "id"> = {
      creditorName,
      accountNumber,
      accountStatus,
      isNegative,
      negativeReason,
      accountBalance,
      dateOpened,
      accountType: isNegative ? "Negative" : "Good",
      creditLimit: null,
      monthlyPayment: null,
      creditBureau: creditBureau,
    };
    
    const result = ParsedTradelineSchema.omit({ id: true }).safeParse(tradeline);
    if (result.success) {
      valid.push(result.data);
    } else {
      rejected.push({ entry: entry.trim(), errors: result.error.errors });
    }
  }

  return { valid, rejected };
};

interface TradelineRow {
  id: string;
  user_id: string;
  creditor_name: string;
  account_number: string;
  account_status?: string;
  account_balance?: string;
  date_opened: string | null;
  account_type?: string | null;
  credit_limit?: string | null;
  monthly_payment?: string | null;
  credit_bureau: string | null;
  created_at?: Date;
  dispute_count?: number;
  isNegative?: boolean;
}

export function fetchUserTradelines(data: TradelineRow[]): ParsedTradeline[] {
  return (data || []).map((row: TradelineRow) => {
    const isNegative = row.account_status ? negativeRegex.test(row.account_status) : false;
    return ParsedTradelineSchema.parse({
      id: row.id,
      creditorName: row.creditor_name || "",
      accountNumber: row.account_number || "",
      accountStatus: row.account_status || "",
      isNegative,
      negativeReason: row.account_status ? negativeRegex.exec(row.account_status)?.[0] ?? null : null,
      accountBalance: typeof row.account_balance === 'string' ? parseFloat(row.account_balance) || "0" : row.account_balance || "0",
      dateOpened: row.date_opened,
      accountType: row.account_type,
      creditLimit: typeof row.credit_limit === 'string' ? parseFloat(row.credit_limit) || "0" : row.credit_limit || "0",
      monthlyPayment: typeof row.monthly_payment === 'string' ? parseFloat(row.monthly_payment) || "0" : row.monthly_payment || "0",
      creditBureau: row.credit_bureau,
    });
  });
}

export async function saveTradelinesToDatabase(tradelines: ParsedTradeline[], userId: string): Promise<void> {
  if (!userId || tradelines.length === 0) return;

  const convertDateFormat = (dateString: string | null): string | null => {
    const match = dateString?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return match ? `${match[3]}-${match[1]}-${match[2]}` : null;
  };

  const rows = tradelines.map((tradeline) => ({
    id: tradeline.id || tradeline.id,
    user_id: userId,
    created_at: new Date(),
    dispute_count: tradeline.disputeCount,
    creditor_name: tradeline.creditorName,
    account_number: tradeline.accountNumber,
    account_status: tradeline.accountStatus,
    account_type: tradeline.accountType,
    account_balance: tradeline.accountBalance,
    date_opened: convertDateFormat(tradeline.dateOpened),
    credit_limit: tradeline.creditLimit,
    monthly_payment: tradeline.monthlyPayment,
    credit_bureau: tradeline.creditBureau,
    isNegative: tradeline.isNegative,
  }));

  const { error } = await supabase.from("tradelines").insert(rows);
  if (error) {
    throw new Error(`Failed to save tradelines: ${error.message}`);
  }
}