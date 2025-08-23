// src/utils/document-ai-processor.ts
import { supabase } from '@/integrations/supabase/client';

export type ParsedTradeline = {
  creditor_name: string;
  account_number: string;
  account_balance: string;
  credit_limit: string;
  monthly_payment: string;
  date_opened: string;
  account_status: string;
  account_type: string;
  credit_bureau: string;
  is_negative: boolean;
  user_id?: string;
};

export async function processAndSaveTradelines(file: File): Promise<ParsedTradeline[]> {
  // Use Supabase edge function for AWS Textract OCR processing
  const { data, error } = await supabase.functions.invoke('textract-ocr', {
    body: {
      file: Array.from(new Uint8Array(await file.arrayBuffer())),
      mimeType: file.type
    }
  });

  if (error) {
    throw new Error(error.message || "Failed to process document with Textract");
  }

  if (!data?.text) {
    throw new Error("No text extracted from document");
  }

  console.log('Textract extracted text:', data.text.substring(0, 500) + '...');

  // Parse the extracted text into tradelines using enhanced parser
  const tradelines = parseTextToTradelines(data.text);
  return tradelines;
}

function parseTextToTradelines(text: string): ParsedTradeline[] {
  // Simple parsing logic - this should be enhanced based on your credit report format
  const lines = text.split('\n');
  const tradelines: ParsedTradeline[] = [];
  
  // Look for patterns that indicate tradeline information
  // This is a basic implementation - enhance based on actual credit report formats
  lines.forEach((line, index) => {
    if (line.includes('Account') || line.includes('Creditor')) {
      // Try to extract tradeline information from surrounding lines
      const tradeline: ParsedTradeline = {
        creditor_name: extractCreditorName(line),
        account_number: extractAccountNumber(lines, index),
        account_balance: extractBalance(lines, index),
        credit_limit: extractCreditLimit(lines, index),
        monthly_payment: extractMonthlyPayment(lines, index),
        date_opened: extractDateOpened(lines, index),
        account_status: extractAccountStatus(lines, index),
        account_type: extractAccountType(lines, index),
        credit_bureau: 'Unknown',
        is_negative: checkIfNegative(lines, index)
      };
      
      if (tradeline.creditor_name && tradeline.account_number) {
        tradelines.push(tradeline);
      }
    }
  });
  
  return tradelines;
}

function extractCreditorName(line: string): string {
  // Extract creditor name from line
  const match = line.match(/(?:Creditor|Account):\s*([^,\n]+)/i);
  return match ? match[1].trim() : 'Unknown Creditor';
}

function extractAccountNumber(lines: string[], currentIndex: number): string {
  // Look for account number in current and nearby lines
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const match = lines[i].match(/(?:Account|Acct).*?(\d{4,})/i);
    if (match) return match[1];
  }
  return 'Unknown';
}

function extractBalance(lines: string[], currentIndex: number): string {
  // Look for balance information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const match = lines[i].match(/(?:Balance|Bal).*?\$?([\d,]+\.?\d*)/i);
    if (match) return match[1];
  }
  return '0';
}

function extractCreditLimit(lines: string[], currentIndex: number): string {
  // Look for credit limit information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const match = lines[i].match(/(?:Limit|Credit Limit).*?\$?([\d,]+\.?\d*)/i);
    if (match) return match[1];
  }
  return '0';
}

function extractMonthlyPayment(lines: string[], currentIndex: number): string {
  // Look for monthly payment information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const match = lines[i].match(/(?:Monthly|Payment).*?\$?([\d,]+\.?\d*)/i);
    if (match) return match[1];
  }
  return '0';
}

function extractDateOpened(lines: string[], currentIndex: number): string {
  // Look for date opened information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const match = lines[i].match(/(?:Opened|Date Opened).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (match) return match[1];
  }
  return '';
}

function extractAccountStatus(lines: string[], currentIndex: number): string {
  // Look for account status information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('current')) return 'current';
    if (line.includes('late') || line.includes('delinquent')) return 'late';
    if (line.includes('charged off') || line.includes('charge off')) return 'charged_off';
    if (line.includes('collection')) return 'collection';
    if (line.includes('closed')) return 'closed';
  }
  return 'unknown';
}

function extractAccountType(lines: string[], currentIndex: number): string {
  // Look for account type information
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('credit card') || line.includes('revolving')) return 'credit_card';
    if (line.includes('mortgage') || line.includes('home loan')) return 'mortgage';
    if (line.includes('auto') || line.includes('vehicle')) return 'auto_loan';
    if (line.includes('personal loan') || line.includes('installment')) return 'personal_loan';
    if (line.includes('student loan')) return 'student_loan';
  }
  return 'unknown';
}

function checkIfNegative(lines: string[], currentIndex: number): boolean {
  // Check if this tradeline has negative indicators
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(lines.length - 1, currentIndex + 2); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('late') || line.includes('delinquent') || 
        line.includes('charged off') || line.includes('collection') ||
        line.includes('bankruptcy') || line.includes('foreclosure')) {
      return true;
    }
  }
  return false;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1];
        resolve(base64);
      } else {
        reject("Failed to read file as base64 string");
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
