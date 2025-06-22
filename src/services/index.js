import { GoogleGenAI } from '@google/genai';

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
  vertexai: true,
});
const model = 'gemini-2.5-flash';


// Set up generation config
const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 1,
  seed: 0,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};

const msg1Text1 = {text: `Extract the following fields from this credit report tradeline section. Return the results as a JSON object with exactly these property names and types:
        - creditor_name: string
        - account_number: string
        - account_balance: string
        - created_at: string (ISO date, use today's date if not present)
        - credit_limit: string
        - monthly_payment: string
        - date_opened: string
        - is_negative: boolean (true if this account is negative, otherwise false)
        - account_type: string (must match one of: "credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection")
        - account_status: string (must match one of: "open", "closed", "in_collection", "charged_off", "disputed")
        - credit_bureau: string (must match one of: "equifax", "transunion", "experian")
        Here is the tradeline text:
        \\\`\\\`\\\`
        ${text}
        \\\`\\\`\\\`
        Return only a JSON object, nothing else.`};

const chat = ai.chats.create({
  model: model,
  config: generationConfig
});

async function sendMessage(message) {
  const response = await chat.sendMessageStream({
    message: message
  });
  process.stdout.write('stream result: ');
  for await (const chunk of response) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
    } else {
      process.stdout.write(JSON.stringify(chunk) + '\n');
    }
  }
}

async function generateContent() {
  await sendMessage([
    msg1Text1
  ]);
}

generateContent();