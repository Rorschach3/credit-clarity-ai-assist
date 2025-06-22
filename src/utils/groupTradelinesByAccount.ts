export type Bureau = "equifax" | "transunion" | "experian";

export interface BureauTradeline {
  account_name?: string;
  account_number?: string;
  account_status?: string;
  date_opened?: string;
  account_balance?: string;
  account_type?: string;
  credit_limit?: string;
  monthly_payment?: string;
  dispute_count?: number;
  credit_bureau?: string;
}

export interface GroupedTradeline {
  key: string; // e.g., `${accountName}|${accountNumber}`
  equifax?: BureauTradeline;
  transunion?: BureauTradeline;
  experian?: BureauTradeline;
}

export function groupTradelinesByAccount(
  tradelines: BureauTradeline[]
): GroupedTradeline[] {
  const map = new Map<string, GroupedTradeline>();

  tradelines.forEach((t) => {
    const key = `${t.account_name}|${t.account_number}`;
    if (!map.has(key)) {
      map.set(key, { key });
    }
    const group = map.get(key)!;
    if (t.credit_bureau === "equifax") group.equifax = t;
    if (t.credit_bureau === "transunion") group.transunion = t;
    if (t.credit_bureau === "experian") group.experian = t;
    if (t.credit_bureau === null) group[" "] = t;
  });

  return Array.from(map.values());
}