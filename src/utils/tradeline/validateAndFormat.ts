/**
 * Utility for validating and formatting tradeline data
 * Ensures all required fields are present with sensible defaults
 * and formats numeric values as USD currency strings
 */

import { ParsedTradeline } from '../tradelineParser';

/**
 * Formats a number as USD currency string
 * @param value - The value to format (can be string or number)
 * @returns Formatted USD currency string (e.g., "$1,234.56")
 */
function formatUSD(value: string | number | null | undefined): string {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return '$0.00';
  }

  // Convert to string and remove non-numeric characters except dots and minus
  const stringValue = String(value).replace(/[^0-9.-]/g, '');
  
  // Parse as float
  const numericValue = parseFloat(stringValue);
  
  // If not a valid number, return default
  if (isNaN(numericValue)) {
    return '$0.00';
  }

  // Format as USD currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/**
 * Validates and formats a tradeline object
 * Ensures all key fields are present and properly formatted
 * @param tradeline - The tradeline object to validate and format
 * @returns A new tradeline object with all fields validated and formatted
 */
export function validateAndFormatTradeline(tradeline: Partial<ParsedTradeline>): ParsedTradeline {
  // Required fields with defaults
  const id = tradeline.id || '';
  const user_id = tradeline.user_id || '';
  const created_at = tradeline.created_at || new Date().toISOString();

  // String fields with sensible defaults
  const creditor_name = tradeline.creditor_name?.trim() || 'N/A';
  const account_number = tradeline.account_number?.trim() || 'N/A';
  const account_type = tradeline.account_type?.trim() || 'N/A';
  const account_status = tradeline.account_status?.trim() || 'N/A';
  const date_opened = tradeline.date_opened?.trim() || 'N/A';
  const credit_bureau = tradeline.credit_bureau?.trim() || 'N/A';

  // Currency fields - format as USD
  const account_balance = formatUSD(tradeline.account_balance);
  const credit_limit = formatUSD(tradeline.credit_limit);
  const monthly_payment = formatUSD(tradeline.monthly_payment);

  // Numeric fields with defaults
  const dispute_count = typeof tradeline.dispute_count === 'number' 
    ? tradeline.dispute_count 
    : 0;

  // Boolean fields with defaults
  const is_negative = tradeline.is_negative === true;

  return {
    id,
    user_id,
    creditor_name,
    account_number,
    account_type,
    account_balance,
    credit_limit,
    monthly_payment,
    date_opened,
    account_status,
    dispute_count,
    is_negative,
    created_at,
    credit_bureau,
  };
}

/**
 * Validates and formats an array of tradelines
 * @param tradelines - Array of tradeline objects to validate and format
 * @returns Array of validated and formatted tradeline objects
 */
export function validateAndFormatTradelines(tradelines: Partial<ParsedTradeline>[]): ParsedTradeline[] {
  return tradelines.map(validateAndFormatTradeline);
}
