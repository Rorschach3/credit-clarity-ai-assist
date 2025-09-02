import { supabase } from "@/integrations/supabase/client";
import { ParsedTradeline } from "@/utils/tradelineParser";
import { v4 as uuidv4 } from 'uuid';

export interface TextractProcessingResult {
  tradelines: ParsedTradeline[];
  success: boolean;
  message?: string;
  extractedText?: string;
}

// Function to process PDF with AWS Textract
export async function processPdfWithTextract(file: File, userId: string): Promise<TextractProcessingResult> {
  try {
    console.log('🚀 Starting AWS Textract processing...');
    
    // Convert file to ArrayBuffer then to Array for JSON serialization
    const arrayBuffer = await file.arrayBuffer();
    const fileArray = Array.from(new Uint8Array(arrayBuffer));
    
    // Call the Textract edge function
    const { data, error } = await supabase.functions.invoke('textract-ocr', {
      body: {
        file: fileArray,
        mimeType: file.type,
        fileName: file.name
      }
    });

    if (error) {
      console.error('❌ Textract edge function error:', error);
      throw new Error(`Textract processing failed: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ Textract processing failed:', data.error);
      throw new Error(data.error || 'Textract processing failed');
    }

    console.log('✅ Textract processing successful');
    console.log(`📄 Extracted text length: ${data.text?.length || 0} characters`);

    // Parse the extracted text to find tradelines
    const tradelines = parseTextractTextToTradelines(data.text || '', userId);
    
    return {
      tradelines,
      success: true,
      message: `Extracted ${tradelines.length} tradelines using AWS Textract`,
      extractedText: data.text
    };

  } catch (error) {
    console.error('❌ AWS Textract processing error:', error);
    return {
      tradelines: [],
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during Textract processing'
    };
  }
}

// Parse Textract extracted text to identify tradelines
function parseTextractTextToTradelines(text: string, userId: string): ParsedTradeline[] {
  console.log('🔍 Parsing Textract text for tradelines...');
  
  if (!text || text.trim().length === 0) {
    console.log('⚠️ No text to parse');
    return [];
  }

  const tradelines: ParsedTradeline[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common credit bureau patterns
  const bureauPatterns = {
    experian: /experian|exp/i,
    equifax: /equifax|eqf/i,
    transunion: /transunion|tu/i
  };

  // Common creditor patterns
  const creditorPatterns = [
    /chase|jpmorgan/i,
    /citi|citibank/i,
    /bank of america|boa/i,
    /capital one|cap one/i,
    /discover/i,
    /american express|amex/i,
    /wells fargo/i,
    /synchrony/i,
    /credit one/i,
    /first premier/i
  ];

  // Account number patterns
  const accountPattern = /(?:account|acct)[\s#:]*([0-9x*]{4,})/i;
  
  // Balance patterns
  const balancePattern = /(?:balance|bal)[\s:]*\$?([0-9,]+\.?\d*)/i;
  
  // Payment patterns
  const paymentPattern = /(?:payment|pay)[\s:]*\$?([0-9,]+\.?\d*)/i;
  
  // Credit limit patterns
  const limitPattern = /(?:limit|credit limit)[\s:]*\$?([0-9,]+\.?\d*)/i;

  // Negative item indicators
  const negativeIndicators = [
    /late|delinquent|past due/i,
    /collection|charge.*off/i,
    /bankruptcy|foreclosure/i,
    /judgment|lien/i
  ];

  let currentBureau = 'Unknown';
  let currentCreditor = 'Unknown Creditor';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for bureau section headers
    for (const [bureau, pattern] of Object.entries(bureauPatterns)) {
      if (pattern.test(line)) {
        currentBureau = bureau.charAt(0).toUpperCase() + bureau.slice(1);
        continue;
      }
    }
    
    // Check for creditor names
    const creditorMatch = creditorPatterns.find(pattern => pattern.test(line));
    if (creditorMatch) {
      currentCreditor = extractCreditorName(line);
    }
    
    // Look for account information
    const accountMatch = line.match(accountPattern);
    if (accountMatch) {
      const accountNumber = accountMatch[1];
      
      // Look for additional info in surrounding lines
      const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
      
      const balanceMatch = context.match(balancePattern);
      const paymentMatch = context.match(paymentPattern);
      const limitMatch = context.match(limitPattern);
      
      // Check if this is a negative item
      const isNegative = negativeIndicators.some(pattern => pattern.test(context));
      
      const tradeline: ParsedTradeline = {
        id: uuidv4(),
        user_id: userId,
        creditor_name: currentCreditor,
        account_number: accountNumber,
        account_balance: balanceMatch ? balanceMatch[1].replace(/,/g, '') : '0',
        credit_limit: limitMatch ? limitMatch[1].replace(/,/g, '') : '0',
        monthly_payment: paymentMatch ? paymentMatch[1].replace(/,/g, '') : '0',
        date_opened: new Date().toISOString().split('T')[0], // Default to today
        account_status: isNegative ? 'delinquent' : 'current',
        account_type: inferAccountType(currentCreditor, context),
        credit_bureau: currentBureau,
        is_negative: isNegative,
        dispute_count: 0,
        created_at: new Date().toISOString()
      };
      
      tradelines.push(tradeline);
      console.log(`✅ Found tradeline: ${currentCreditor} - ${accountNumber}`);
    }
  }
  
  console.log(`🎯 Parsed ${tradelines.length} tradelines from Textract text`);
  return tradelines;
}

// Helper function to extract creditor name from a line
function extractCreditorName(line: string): string {
  // Remove common prefixes and suffixes
  let name = line
    .replace(/account|acct|payment|balance|limit/gi, '')
    .replace(/[0-9$,.\-:]/g, '')
    .trim();
    
  if (name.length < 3) {
    return 'Unknown Creditor';
  }
  
  return name.length > 50 ? name.substring(0, 50) : name;
}

// Helper function to infer account type
function inferAccountType(creditorName: string, context: string): string {
  const creditCardIndicators = /credit card|visa|mastercard|discover|amex/i;
  const autoLoanIndicators = /auto|car|vehicle|honda|toyota|ford/i;
  const mortgageIndicators = /mortgage|home|real estate|property/i;
  const personalLoanIndicators = /personal|installment|loan/i;
  
  if (creditCardIndicators.test(creditorName) || creditCardIndicators.test(context)) {
    return 'credit_card';
  }
  
  if (autoLoanIndicators.test(creditorName) || autoLoanIndicators.test(context)) {
    return 'auto_loan';
  }
  
  if (mortgageIndicators.test(creditorName) || mortgageIndicators.test(context)) {
    return 'mortgage';
  }
  
  if (personalLoanIndicators.test(creditorName) || personalLoanIndicators.test(context)) {
    return 'personal_loan';
  }
  
  return 'unknown';
}