import { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to clean and validate JSON responses
function cleanJsonResponse(responseText: string): string {
  if (!responseText || !responseText.trim()) {
    throw new Error('Empty response from LLM');
  }

  const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  return cleaned.trim();
}

interface TradelineData {
  creditor_name: string;
  account_number: string;
  account_balance: string;
  created_at: string;
  credit_limit: string;
  monthly_payment: string;
  date_opened: string;
  is_negative: boolean;
  account_type: string;
  account_status: string;
  credit_bureau: string;
}

function validateJsonStructure(jsonStr: string): TradelineData {
  try {
    const data = JSON.parse(jsonStr);

    const requiredFields = {
      creditor_name: '',
      account_number: '',
      account_balance: '',
      created_at: new Date().toISOString(),
      credit_limit: '',
      monthly_payment: '',
      date_opened: '',
      is_negative: false,
      account_type: 'credit_card',
      account_status: 'open',
      credit_bureau: 'equifax',
    };

    for (const [field, defaultValue] of Object.entries(requiredFields)) {
      if (!(field in data)) {
        data[field] = defaultValue;
      }
    }

    const validAccountTypes = ['credit_card', 'loan', 'mortgage', 'auto_loan', 'student_loan', 'collection'];
    const validAccountStatuses = ['open', 'closed', 'in_collection', 'charged_off', 'disputed'];
    const validCreditBureaus = ['equifax', 'transunion', 'experian'];

    if (!validAccountTypes.includes(data.account_type)) {
      data.account_type = 'credit_card';
    }

    if (!validAccountStatuses.includes(data.account_status)) {
      data.account_status = 'open';
    }

    if (!validCreditBureaus.includes(data.credit_bureau)) {
      data.credit_bureau = 'equifax';
    }

    return data;
  } catch (err: unknown) {
    throw new Error(`Invalid JSON format: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function parseDocumentViaProxy(base64: string): Promise<object> {
  console.log(`📤 Sending to proxy: /parse-tradeline`);

  try {
    const res = await fetch('http://localhost:8000/parse-tradeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: base64 }),
    });

    console.log(`📥 Response status: ${res.status}`);
    const responseText = await res.text();
    console.log(`📥 Raw response body: ${responseText.substring(0, 500)}...`);

    if (!res.ok) {
      console.error(`❌ Proxy error: ${responseText}`);
      throw new Error(`Proxy error: ${res.status} - ${responseText}`);
    }

    if (!responseText.trim()) {
      throw new Error('Empty response from proxy server');
    }

    try {
      const cleanedJson = cleanJsonResponse(responseText);
      console.log(`📥 Cleaned JSON response: ${cleanedJson.substring(0, 500)}...`);
      return validateJsonStructure(cleanedJson);
    } catch (jsonErr: unknown) {
      const errorMessage = jsonErr instanceof Error ? jsonErr.message : 'Unknown error';
      console.error(`JSON parsing error: ${errorMessage}`);
      console.error(`Raw response: ${responseText.substring(0, 500)}...`);

      return {
        creditor_name: 'null',
        account_number: 'null',
        account_balance: '0',
        created_at: new Date().toISOString(),
        credit_limit: '0',
        monthly_payment: '0',
        date_opened: 'null',
        is_negative: false,
        account_type: 'credit_card',
        account_status: 'open',
        credit_bureau: 'null',
        parse_error: errorMessage
      };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Network or server error: ${errorMessage}`);
    throw err;
  }
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContentStream({
        contents: contents
      });
        const chunks: string[] = [];
        for await (const chunk of result.stream) {
          const text = chunk.text();
          chunks.push(text);
          onChunk?.(text);
        }

      const finalResult = chunks.join('');
      if (!finalResult.trim()) {
        throw new Error('Empty response from Gemini API');
      }

      return finalResult;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (lastError.message.includes('429') || lastError.message.toLowerCase().includes('rate')) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Rate limited. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export async function sendChatMessage(
  message: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const chat = model.startChat();
      const result = await chat.sendMessageStream(message);
      const chunks: string[] = [];
      for await (const chunk of result.stream) {
        const text = chunk.text();
        chunks.push(text);
        onChunk?.(text);
      }

      const finalResult = chunks.join('');
      if (!finalResult.trim()) {
        throw new Error('Empty response from chat API');
      }

      return finalResult;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      console.warn(`Chat attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Max chat retries exceeded');
}

export async function extractTradelineData(
  text: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  if (!text || !text.trim()) {
    throw new Error('Input text is empty');
  }

  const prompt = `You are a financial document parser. Extract the following fields from this credit report tradeline section and return ONLY a valid JSON object with no additional text, markdown, or explanations.

Required JSON format:
{
  "creditor_name": "string",
  "account_number": "string", 
  "account_balance": "string (no currency symbols)",
  "created_at": "string (yyyy-MM-dd format)",
  "credit_limit": "string (no currency symbols)",
  "monthly_payment": "string (no currency symbols)",
  "date_opened": "string",
  "is_negative": boolean,
  "account_type": "string",
  "account_status": "string",
  "credit_bureau": "string",
}

Field constraints:
- account_type must be one of: "credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection"
- account_status must be one of: "open", "closed", "in_collection", "charged_off", "disputed"  
- credit_bureau must be one of: "equifax", "transunion", "experian"
- is_negative should be true for negative accounts, false otherwise
- created_at should be today's date in ISO format if not found in text
- remove the "\`\`\`json" and "\`\`\`" markdown code blocks if present

Tradeline text to parse:
\`\`\`
${text}
\`\`\`

Return only the JSON object, no other text:`;

  try {
    const result = await sendChatMessage(prompt, onChunk);
    const cleanedJson = cleanJsonResponse(result);
    const validatedData = validateJsonStructure(cleanedJson);
    // REMOVED: validatedData.raw_text = text; - This was causing the 500 error
    return JSON.stringify(validatedData, null, 2);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Tradeline extraction failed: ${errorMessage}`);

    const fallbackData = {
      creditor_name: 'Unknown',
      account_number: 'Unknown',
      account_balance: '0',
      created_at: new Date().toISOString(),
      credit_limit: '0',
      monthly_payment: '0',
      date_opened: 'Unknown',
      is_negative: false,
      account_type: 'credit_card',
      account_status: 'open',
      credit_bureau: 'equifax',
      parse_error: errorMessage
    };

    return JSON.stringify(fallbackData, null, 2);
  }
}

export class GoogleGeminiParser {
  constructor(private apiKey = import.meta.env.VITE_GEMINI_API_KEY) {
    if (!this.apiKey) {
      throw new Error('Missing Gemini API Key');
    }
  }

  async parseTradelineWithGemini(text: string) {
    if (!text || !text.trim()) {
      throw new Error('Input text is required');
    }

    return extractTradelineData(text);
  }
}

export async function parseDocumentAndGenerate(
  base64: string,
  prompt: string,
  onChunk?: (chunk: GenerationChunk) => void
): Promise<string> {
  if (!base64 || !prompt) {
    throw new Error('Both base64 data and prompt are required');
  }

  try {
    const parsed = await parseDocumentViaProxy(base64);
    
    // Extract text from parsed response safely
    const documentText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);

    if (!documentText.trim()) {
      throw new Error('No text content found in parsed document');
    }

    const fullPrompt = `${prompt}\n\nDocument content:\n${documentText}`;    
    return generateContent([
      {
        role: "user",
        parts: [{ text: fullPrompt }]
      }
    ], onChunk);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Document parsing and generation failed: ${errorMessage}`);
    throw err;
  }
}