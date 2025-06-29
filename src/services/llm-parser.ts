import { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI } from "@google/generative-ai";
import { parseAccountNumbers, ParsedAccount } from '../utils/ocr-parser'; // Import fast OCR functions and types
import { ParsedTradeline } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { z } from "zod"; // Import z for schema validation

type DocumentRow = Database['public']['Tables']['documents']['Row'];

// Helper function to clean and validate JSON responses
function cleanJsonResponse(responseText: string): string {
  if (!responseText || !responseText.trim()) {
    throw new Error('Empty response from LLM');
  }

  // Remove markdown code blocks
  let cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

  // Remove any text before the first { or [
  const jsonStart = Math.max(cleaned.indexOf('{'), cleaned.indexOf('['));
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }

  // Remove any text after the last } or ]
  const jsonEndBrace = cleaned.lastIndexOf('}');
  const jsonEndBracket = cleaned.lastIndexOf(']');
  const jsonEnd = Math.max(jsonEndBrace, jsonEndBracket);

  if (jsonEnd > 0 && jsonEnd < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEnd + 1);
  }

  return cleaned;
}

// Define an interface for the proxy response
interface ProxyParseResponse {
  success: boolean;
  text?: string;
  tradelines?: ParsedTradeline[]; // Assuming proxy might return some initial tradelines
  keywords?: string[];
  insights?: string;
  error?: string;
}

// Update your function signature
export async function parseDocumentViaProxy(base64: string, documentId?: string): Promise<ProxyParseResponse> {
  console.log(`📤 Sending to proxy: /parse-tradeline`);

  try {
    const res = await fetch('http://localhost:8000/parse-tradeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_API_KEY as string,
        'x-supabase-auth': process.env.VITE_SUPABASE_AUTH_TOKEN as string,
      },
      body: JSON.stringify({ file: base64, mimeType: 'application/pdf' }),
    });

    console.log(`📥 Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Proxy error: ${errorText}`);
      if (documentId) {
        await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
      }
      throw new Error(`Proxy error: ${res.status} - ${errorText}`);
    }

    // Parse as JSON instead of text
    const responseData = await res.json();
    console.log(`📥 Parsed JSON response from proxy:`, responseData);

    // Check for parse errors in the response
    if (responseData.parse_error) {
      console.error(`❌ AI parsing error: ${responseData.parse_error}`);
      if (documentId) {
        await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
      }
      throw new Error(`AI parsing failed: ${responseData.parse_error}`);
    }

    return responseData;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Network or server error in parseDocumentViaProxy: ${errorMessage}`);
    if (documentId) {
      await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
    }
    throw err; // Re-throw instead of returning empty string
  }
}
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.2,
    topP: 0.8,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }
  ],
});

type GenerationChunk = string;

export async function generateContent(
  contents: { role: string; parts: { text: string }[] }[],
  documentId?: string, // Added documentId parameter
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentResultChunks: string[] = [];
    try {
      const result = await model.generateContentStream({
        contents: contents
      });

      for await (const chunk of result.stream) {
        const finishReason = chunk.candidates?.[0]?.finishReason;
        const text = chunk.text();

        // Check for finishReason and empty text as per problem statement
        if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
          console.warn(`Attempt ${attempt + 1}: Gemini API finish_reason: ${finishReason}. Retrying...`);
          lastError = new Error(`Gemini API finished with reason: ${finishReason}`);
          break; // Break from inner loop to trigger outer retry
        }

        if (!text || !text.trim()) {
          console.warn(`Attempt ${attempt + 1}: Empty text chunk from Gemini API. Retrying...`);
          lastError = new Error('Empty text chunk received from Gemini API');
          break; // Break from inner loop to trigger outer retry
        }

        currentResultChunks.push(text);
        onChunk?.(text);
      }

      const finalResult = currentResultChunks.join('');
      if (!finalResult.trim()) {
        console.warn(`Attempt ${attempt + 1}: Final response from Gemini API is empty. Retrying...`);
        throw new Error('Empty response from Gemini API after all chunks');
      }

      return finalResult; // Success
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);

      // Specific handling for rate limiting
      if (lastError.message.includes('429') || lastError.message.toLowerCase().includes('rate')) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Rate limited. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Continue to next attempt
      }

      // If it's a content-related error or empty text, and not the last attempt, retry with back-off
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`Retrying after ${delay}ms for attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all retries fail, update document status if documentId is provided
  if (documentId) {
    console.error(`🔴 Failed to generate content for document ${documentId} after ${maxRetries} attempts.`);
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'parse_failed' as DocumentRow['status'] })
      .eq('id', documentId);

    if (updateError) {
      console.error(`Failed to update document status for ${documentId}:`, updateError);
    }
  }

  throw lastError || new Error('Max retries exceeded for content generation');
}

export async function sendChatMessage(
  message: string,
  documentId?: string, // Added documentId parameter
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentResultChunks: string[] = [];
    try {
      const chat = model.startChat();
      const result = await chat.sendMessageStream(message);

      for await (const chunk of result.stream) {
        const finishReason = chunk.candidates?.[0]?.finishReason;
        const text = chunk.text();

        if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
          console.warn(`Chat attempt ${attempt + 1}: Gemini API finish_reason: ${finishReason}. Retrying...`);
          lastError = new Error(`Gemini chat API finished with reason: ${finishReason}`);
          break;
        }

        if (!text || !text.trim()) {
          console.warn(`Chat attempt ${attempt + 1}: Empty text chunk from chat API. Retrying...`);
          lastError = new Error('Empty text chunk received from Gemini chat API');
          break;
        }

        currentResultChunks.push(text);
        onChunk?.(text);
      }

      const finalResult = currentResultChunks.join('');
      if (!finalResult.trim()) {
        console.warn(`Chat attempt ${attempt + 1}: Final response from chat API is empty. Retrying...`);
        throw new Error('Empty response from chat API after all chunks');
      }

      return finalResult;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      console.warn(`Chat attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`Retrying after ${delay}ms for chat attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all retries fail, update document status if documentId is provided (for chat related failures)
  if (documentId) {
    console.error(`🔴 Failed to send chat message for document ${documentId} after ${maxRetries} attempts.`);
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'parse_failed' as DocumentRow['status'] })
      .eq('id', documentId);

    if (updateError) {
      console.error(`Failed to update document status for ${documentId}:`, updateError);
    }
  }

  throw lastError || new Error('Max chat retries exceeded');
}

// TODO: Deprecate or remove this function as it's designed for single tradeline entries
// It might be kept for potential future use or if other parts of the codebase rely on it.
export async function extractTradelineData(
  text: string,
  documentId?: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<ParsedTradeline> {
  if (!text || !text.trim()) {
    throw new Error('Input text is empty');
  }

  // Integrate Fast Account Number Extraction (Keep this for now, might be useful)
  const fastOcrAccounts = parseAccountNumbers(text);
  console.log('Fast OCR extracted accounts in extractTradelineData:', fastOcrAccounts);

  let prompt = `You are a financial document parser. Extract the following fields from this credit report tradeline section and return ONLY a valid JSON object with no additional text, markdown, or explanations.`;

  if (fastOcrAccounts.length > 0) {
    prompt += `\n\n**IMPORTANT**: I have already run a fast OCR method to pre-extract potential account numbers. If you find these account numbers in the text below, please use them as the 'account_number' field in your JSON output to improve accuracy and efficiency. Prioritize these if they are clearly present and relevant to a tradeline. Here are the fast OCR results:\n`;
    fastOcrAccounts.forEach(acc => {
      prompt += `- Original Match: "${acc.raw}", Normalized Account Number: "${acc.normalized}", Type: "${acc.type}", Confidence: ${acc.confidence}, Context: "${acc.context}"\n`;
    });
    prompt += `\n`;
  }

  prompt += `Required JSON format:
  {
    "creditor_name": "string",
    "account_number": "string",
    "account_balance": "string",
    "created_at": "string (ISO format)",
    "credit_limit": "string",
    "monthly_payment": "string",
    "date_opened": "string",
    "is_negative": boolean,
    "account_type": "credit_card|loan|mortgage|auto_loan|student_loan|collection",
    "account_status": "open|closed|in_collection|charged_off|disputed",
    "dispute_count": number
  }

  Field constraints:
  - created_at should be today's date in ISO format if not found in text
  - account_type must be one of: "credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection"
  - account_status must be one of: "open", "closed", "in_collection", "charged_off|disputed"
  - is_negative should be true for negative accounts, false otherwise
  - Remove any markdown code blocks from your response
  - credit_limit, account_balance, and monthly_payment default to "$0" if not found
  - date_opened defaults to "Unknown" if not found
  - dispute_count should be a number, default to 0

  Tradeline text to parse:
  \`\`\`
  ${text}
  \`\`\`

  Return only the JSON object, no other text:`;

   try {
     const result = await sendChatMessage(prompt, documentId, onChunk);
     console.log('Raw LLM response:', result);

     const cleanedJson = cleanJsonResponse(result);
     console.log('Cleaned JSON:', cleanedJson);

     // Validate the parsed JSON against the ParsedTradelineSchema (if needed, or rely on downstream validation)
     // For now, we assume the LLM adheres to the schema.
     return JSON.parse(cleanedJson) as ParsedTradeline;
   } catch (err: unknown) {
     const errorMessage = err instanceof Error ? err.message : 'Unknown error';
     console.error(`Tradeline extraction failed: ${errorMessage}`);
     throw err;
   }
 }

// TODO: Deprecate or remove this function as it's designed for single tradeline entries
export async function parseTradelineWithRetry(
  entry: string,
  userId: string,
  maxRetries: number,
  timeoutMs: number,
  documentId?: string // Added documentId parameter
): Promise<ParsedTradeline | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for tradeline parsing`);

      // Validate entry size before LLM call
      if (entry.length > 10000) {
        entry = entry.substring(0, 10000) + "...[truncated]";
        console.warn("⚠️ Entry truncated for LLM processing");
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM parsing timeout')), timeoutMs);
      });

      const llmPromise = extractTradelineData(entry, documentId);
      const jsonResult = await Promise.race([llmPromise, timeoutPromise]);

      // Enhanced validation of LLM response
      if (!jsonResult || typeof jsonResult !== 'object' || Object.keys(jsonResult).length === 0) {
        throw new Error('LLM returned empty or invalid response');
      }

      return jsonResult;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log specific error types
      if (lastError.message.includes('finish_reason')) {
        console.warn(`⚠️ Gemini API blocked content (attempt ${attempt}):`, lastError.message);
      } else if (lastError.message.includes('timeout')) {
        console.warn(`⚠️ Request timeout (attempt ${attempt}):`, lastError.message);
      }

      // If it's the last attempt and still failing, re-throw the error
      if (attempt === maxRetries) {
        console.error(`❌ Max retries reached for tradeline parsing. Last error:`, lastError);
        return null;
      }

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`Retrying after ${delay}ms for attempt ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

// TODO: Deprecate or remove this class as it's designed for single tradeline entries
export class GoogleGeminiParser {
  constructor(private apiKey = process.env.VITE_GEMINI_API_KEY as string) {
    if (!this.apiKey) {
      throw new Error('Missing Gemini API Key');
    }
  }

  async parseTradelineWithGemini(text: string, documentId?: string) {
    if (!text || !text.trim()) {
      throw new Error('Input text is required');
    }
    // This function will now use the new parseTradelineWithRetry
    // For simplicity, using default retry/timeout. Adjust as needed.
    return parseTradelineWithRetry(text, "default-user", 3, 30000, documentId);
  }
}

// This function is for generating general content from a document, not specifically tradelines
export async function parseDocumentAndGenerate(
  documentId: string,
  base64: string,
  prompt: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  if (!documentId) {
    console.error('Document ID is required for parseDocumentAndGenerate.');
    throw new Error('Document ID is required');
  }
  if (!base64 || !prompt) {
    console.error('Both base64 data and prompt are required for document parsing and generation.');
    await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
    throw new Error('Both base64 data and prompt are required');
  }

  try {
    const rawOcrText = await parseDocumentViaProxy(base64, documentId);

    if (!rawOcrText.text?.trim()) {
      console.error(`No OCR text content found in parsed document for document ID: ${documentId}. Setting status to parse_failed.`);
      await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
      throw new Error('No OCR text content found in parsed document');
    }

    const fullPrompt = `${prompt}\n\nDocument content:\n${rawOcrText.text}`;
    return generateContent([
      {
        role: "user",
        parts: [{ text: fullPrompt }]
      }
    ], documentId, onChunk);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Document parsing and generation failed for document ID: ${documentId}. Error: ${errorMessage}. Setting status to parse_failed.`);
    await supabase.from('documents').update({ status: 'parse_failed' as DocumentRow['status'] }).eq('id', documentId);
    throw err;
  }
}

/**
 * Extracts all tradelines from the full text of a credit report using an LLM.
 * @param fullText The complete raw text extracted from the credit report PDF.
 * @param documentId Optional document ID for logging/status updates.
 * @param onChunk Optional callback for streaming LLM response chunks.
 * @returns A promise resolving to an array of ParsedTradeline objects.
 */
export async function extractAllTradelines(
  fullText: string,
  documentId?: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<ParsedTradeline[]> {
  if (!fullText || !fullText.trim()) {
    throw new Error('Input text is empty for extracting all tradelines');
  }

  // Integrate Fast Account Number Extraction (Can still be useful to prime the LLM)
  const fastOcrAccounts = parseAccountNumbers(fullText);
  console.log('Fast OCR extracted accounts in extractAllTradelines:', fastOcrAccounts);


  // Craft the prompt to instruct the LLM to extract ALL tradelines as a JSON array
  let prompt = `You are a financial document parser. Extract all credit tradeline/account data from the following credit report text. Return ONLY a valid JSON array of objects, with no additional text, markdown, or explanations.`;

  if (fastOcrAccounts.length > 0) {
    prompt += `\n\n**IMPORTANT**: I have already run a fast OCR method to pre-extract potential account numbers. If you find these account numbers in the text below, please use them as the 'account_number' field in your JSON output to improve accuracy and efficiency. Prioritize these if they are clearly present and relevant to a tradeline. Here are the fast OCR results:\n`;
    fastOcrAccounts.forEach(acc => {
      prompt += `- Original Match: "${acc.raw}", Normalized Account Number: "${acc.normalized}", Type: "${acc.type}", Confidence: ${acc.confidence}, Context: "${acc.context}"\n`;
    });
    prompt += `\n`;
  }


  prompt += `Each object in the array should have the following fields (use snake_case):
  {
    "creditor_name": "string",
    "account_number": "string",
    "account_balance": "string",
    "created_at": "string (ISO format)",
    "credit_limit": "string",
    "monthly_payment": "string",
    "date_opened": "string",
    "is_negative": boolean,
    "account_type": "credit_card|loan|mortgage|auto_loan|student_loan|collection|other", // Added 'other' for flexibility
    "account_status": "open|closed|in_collection|charged_off|disputed|other", // Added 'other' for flexibility
    "dispute_count": number,
    "rawText": "string" // Include the raw text section for this specific tradeline
  }

  Field constraints and notes:
  - created_at should be today's date in ISO format if not found in text
  - account_type must be one of: "credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", or "other"
  - account_status must be one of: "open", "closed", "in_collection", "charged_off", "disputed", or "other"
  - is_negative should be true for negative accounts, false otherwise (e.g., late payments, collections, charge-offs)
  - credit_limit, account_balance, and monthly_payment should include currency symbols if present, default to "$0" if not found
  - date_opened should be in MM/DD/YYYY or MM/YYYY format, default to "Unknown" if not found
  - dispute_count should be a number, default to 0
  - The "rawText" field for each tradeline object should contain the specific block of text from the full document that corresponds to that tradeline.
  - Ensure the output is a valid JSON array.

  Full credit report text to parse:
  \`\`\`
  ${fullText}
  \`\`\`

  Return only the JSON array, no other text:`;

  try {
    const result = await sendChatMessage(prompt, documentId, onChunk);
    console.log('Raw LLM response for all tradelines:', result);

    const cleanedJson = cleanJsonResponse(result);
    console.log('Cleaned JSON for all tradelines:', cleanedJson);

    const parsedArray = JSON.parse(cleanedJson);

    // Validate if the parsed result is an array
    if (!Array.isArray(parsedArray)) {
        throw new Error('LLM did not return a JSON array');
    }

    // Optional: Add validation for each item in the array using Zod
    // This would require importing ParsedTradelineSchema from tradelineParser.ts
    // For now, we assume the LLM output structure matches ParsedTradeline
    const validatedTradelines: ParsedTradeline[] = parsedArray.map(item => {
      // Add a basic check or Zod parse here if strict validation is needed
      // For now, assume it matches the structure
      return item as ParsedTradeline;
    });


    return validatedTradelines;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to extract all tradelines: ${errorMessage}`);

    // Update document status if parsing failed for the whole document
    if (documentId) {
        console.error(`🔴 Failed to extract all tradelines for document ${documentId}. Setting status to parse_failed.`);
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'parse_failed' as DocumentRow['status'] })
          .eq('id', documentId);

        if (updateError) {
          console.error(`Failed to update document status for ${documentId}:`, updateError);
        }
    }

    throw err; // Re-throw the error
  }
}