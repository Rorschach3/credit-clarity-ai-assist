import { z } from "zod";

export const ParsedAccountSchema = z.object({
  raw: z.string(),
  normalized: z.string(),
  context: z.string(),
  confidence: z.number().min(0).max(1),
  type: z.enum(['full', 'partial', 'masked']),
  lineNumber: z.number().min(0),
});

export type ParsedAccount = z.infer<typeof ParsedAccountSchema>;

export interface ParserConfig {
  includeContext: boolean;
  contextLines: number;
  minAccountLength: number;
  maxAccountLength: number;
  deduplicate: boolean;
  confidenceThreshold: number;
}

const DEFAULT_CONFIG: ParserConfig = {
  includeContext: true,
  contextLines: 1,
  minAccountLength: 4,
  maxAccountLength: 20,
  deduplicate: true,
  confidenceThreshold: 0.3,
};

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Enhanced temporal patterns with better coverage
  const temporalPatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,                                    // 07/23/2024
    /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?\b/g,      // ISO dates
    /\bDate\s+(?:Opened|Closed|Created|Modified):\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    /\b(?:Last|Next|Current)\s+(?:Update|Payment|Statement):\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
    /\bAs\s+of\s+\d{1,2}\/\d{1,2}\/\d{2,4}/gi,                         // As of 07/23/2024
    /\b\d{2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/gi,                        // Time stamps
  ];

  // Enhanced attribution patterns
  const attributionPatterns = [
    /\b(?:Experian|TransUnion|Equifax|FICO|VantageScore)\b/gi,
    /\b(?:Generated|Powered|Created|Produced)\s+by\s+\S+/gi,
    /\b(?:Report|Data|Information)\s+(?:from|by|via)\s+\S+/gi,
    /\bCopyright\s+©?\s*\d{4}/gi,
    /\b(?:Confidential|Internal|Private)\s+(?:Report|Document|Information)/gi,
    /\bPage\s+\d+\s+of\s+\d+/gi,                                        // Page numbers
    /\bDocument\s+ID:\s*\S+/gi,                                          // Document IDs
  ];

  // Noise patterns (OCR artifacts, formatting remnants)
  const noisePatterns = [
    /\s*\|\s*/g,                                                         // Table separators
    /_{3,}/g,                                                            // Underline artifacts
    /-{3,}/g,                                                            // Dash lines
    /={3,}/g,                                                            // Equal lines
    /\s*\.\s*\.\s*\./g,                                                  // Dot leaders
    /\b(?:N\/A|n\/a|NULL|null|undefined)\b/gi,                          // Null values
  ];

  let sanitized = text;

  // Apply all cleaning patterns
  [...temporalPatterns, ...attributionPatterns, ...noisePatterns].forEach(pattern => {
    sanitized = sanitized.replace(pattern, ' ');
  });

  return sanitized
    .replace(/[^\S\r\n]+/g, ' ')           // Normalize whitespace
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[^\x20-\x7E\r\n]/g, '')      // Remove non-printable ASCII
    .replace(/\s+/g, ' ')                  // Collapse multiple spaces
    .trim();
}

// Enhanced patterns with confidence scoring
const accountPatterns = [
  { 
    pattern: /(?:Account\s*(?:Number|#)?[:\s]*#?\s*)?(\d{4,16})(?:X{2,}|\*{2,}|x{2,})/gi,
    confidence: 0.9,
    type: 'masked' as const
  },
  { 
    pattern: /(?:Acct\.?\s*(?:Number|#)?[:\-\s]*)?(\d{4,16})(?:X{2,}|\*{2,}|x{2,})/gi,
    confidence: 0.85,
    type: 'masked' as const
  },
  { 
    pattern: /ending\s+in\s+(\d{4})/gi,
    confidence: 0.8,
    type: 'partial' as const
  },
  { 
    pattern: /(?:last|final)\s+(?:four|4)\s+(?:digits?)?[:\s]*(\d{4})/gi,
    confidence: 0.75,
    type: 'partial' as const
  },
  { 
    pattern: /(?:Account|Acct)\.?\s*(?:Number|#)?[:\s]*#?\s*(\d{4,20})\b/gi,
    confidence: 0.7,
    type: 'full' as const
  },
  { 
    pattern: /(?:^|\s)(\d{4,20})(?:\s|$)/gm,
    confidence: 0.3,
    type: 'full' as const
  },
  { 
    pattern: /#\s*(\d{4,16})(?:X{2,}|\*{2,}|x{2,}|\d*)/gi,
    confidence: 0.6,
    type: 'masked' as const
  },
  { 
    pattern: /(?:Card|Credit)\s+(?:ending|ending\s+in)\s+(\d{4})/gi,
    confidence: 0.8,
    type: 'partial' as const
  }
];

function calculateConfidence(
  match: RegExpExecArray, 
  baseConfidence: number, 
  context: string,
  accountLength: number
): number {
  let confidence = baseConfidence;
  
  // Length-based adjustments
  if (accountLength >= 8 && accountLength <= 16) confidence += 0.1;
  if (accountLength < 4 || accountLength > 20) confidence -= 0.3;
  
  // Context-based adjustments
  const contextLower = context.toLowerCase();
  const positiveIndicators = [
    'account', 'acct', 'number', 'card', 'credit', 'bank', 
    'loan', 'mortgage', 'savings', 'checking'
  ];
  const negativeIndicators = [
    'phone', 'ssn', 'social', 'zip', 'code', 'id', 'license',
    'date', 'time', 'amount', 'balance', 'payment'
  ];
  
  positiveIndicators.forEach(indicator => {
    if (contextLower.includes(indicator)) confidence += 0.1;
  });
  
  negativeIndicators.forEach(indicator => {
    if (contextLower.includes(indicator)) confidence -= 0.2;
  });
  
  // Format-based adjustments
  if (/X{2,}|\*{2,}|x{2,}/.test(match[0])) confidence += 0.1; // Masked numbers are likely accounts
  if (/^\d+$/.test(match[1]) && match[1].length >= 10) confidence += 0.1; // Long digit sequences
  
  return Math.max(0, Math.min(1, confidence));
}

function extractContext(
  lines: string[], 
  lineIndex: number, 
  config: ParserConfig
): string {
  if (!config.includeContext) return '';
  
  const start = Math.max(0, lineIndex - config.contextLines);
  const end = Math.min(lines.length, lineIndex + config.contextLines + 1);
  
  return lines.slice(start, end)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateAccountNumber(account: string, config: ParserConfig): boolean {
  if (!account || typeof account !== 'string') return false;
  
  const digits = account.replace(/\D/g, '');
  return digits.length >= config.minAccountLength && 
         digits.length <= config.maxAccountLength;
}

export function parseAccountNumbers(
  text: string, 
  config: Partial<ParserConfig> = {}
): ParsedAccount[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!text || typeof text !== 'string') {
    console.warn('[account-parser] Invalid input text provided');
    return [];
  }

  console.log('[account-parser] Processing text input of length:', text.length);
  
  const sanitized = sanitizeText(text);
  const lines = sanitized.split(/\r?\n/).filter(line => line.trim());
  const matches: ParsedAccount[] = [];
  
  for (const [lineIndex, line] of lines.entries()) {
    for (const { pattern, confidence: baseConfidence, type } of accountPatterns) {
      // Reset regex lastIndex to avoid state issues
      pattern.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line))) {
        const raw = match[0].trim();
        const accountDigits = match[1];
        
        if (!validateAccountNumber(accountDigits, finalConfig)) {
          continue;
        }
        
        const context = extractContext(lines, lineIndex, finalConfig);
        const confidence = calculateConfidence(match, baseConfidence, context, accountDigits.length);
        
        if (confidence < finalConfig.confidenceThreshold) {
          continue;
        }
        
        const parsedAccount: ParsedAccount = {
          raw,
          normalized: accountDigits,
          context,
          confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
          type,
          lineNumber: lineIndex,
        };
        
        try {
          ParsedAccountSchema.parse(parsedAccount);
          matches.push(parsedAccount);
        } catch (error) {
          console.warn('[account-parser] Schema validation failed:', error);
        }
      }
    }
  }
  
  console.log('[account-parser] Found', matches.length, 'potential account numbers');
  
  if (!finalConfig.deduplicate) {
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Enhanced deduplication with confidence preference
  const unique = new Map<string, ParsedAccount>();
  
  for (const match of matches) {
    const existing = unique.get(match.normalized);
    if (!existing || match.confidence > existing.confidence) {
      unique.set(match.normalized, match);
    }
  }
  
  const result = Array.from(unique.values())
    .sort((a, b) => b.confidence - a.confidence);
  
  console.log('[account-parser] Returning', result.length, 'unique account numbers');
  return result;
}

// Utility function for batch processing
export function parseMultipleDocuments(
  documents: string[], 
  config: Partial<ParserConfig> = {}
): ParsedAccount[][] {
  return documents.map((doc, index) => {
    console.log(`[account-parser] Processing document ${index + 1}/${documents.length}`);
    return parseAccountNumbers(doc, config);
  });
}

// Export for testing and debugging
export { accountPatterns, calculateConfidence, sanitizeText as _sanitizeText };