import { ParsedTradeline } from '@/types';
import { jest } from '@jest/globals';

export const extractAllTradelines = jest.fn(async (fullText: string): Promise<ParsedTradeline[]> => {
  // Return a mock array of ParsedTradeline objects
  // Customize this mock response to match what your LLM would typically return
  // and what your tests expect.
  console.log('MOCKED extractAllTradelines called with:', fullText.substring(0, 50) + '...');
  return [
    {
      id: '00000000-0000-4000-8000-000000000001',
      user_id: 'mock-user-id',
      creditor_name: 'Mock Bank',
      account_number: '123456789',
      account_balance: '$1000',
      created_at: new Date().toISOString(),
      credit_limit: '$5000',
      monthly_payment: '$100',
      date_opened: '01/15/2020',
      is_negative: false,
      account_type: 'credit_card',
      account_status: 'open',
      credit_bureau: 'experian',
      dispute_count: 0,
      rawText: 'Mock tradeline text for Mock Bank account 123456789',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      user_id: 'mock-user-id',
      creditor_name: 'Another Creditor',
      account_number: '987654321',
      account_balance: '$500',
      created_at: new Date().toISOString(),
      credit_limit: '$0',
      monthly_payment: '$25',
      date_opened: '03/01/2019',
      is_negative: true,
      account_type: 'collection',
      account_status: 'in_collection',
      credit_bureau: 'transunion',
      dispute_count: 1,
      rawText: 'Mock tradeline text for Another Creditor account 987654321',
    },
  ];
});

export const parseDocumentViaProxy = jest.fn(async (base64: string, documentId?: string) => {
  console.log('MOCKED parseDocumentViaProxy called with base64 (truncated):', base64.substring(0, 50) + '...');
  return {
    success: true,
    text: 'Mock OCR text content extracted from PDF. This contains tradeline information.',
    tradelines: [], // Can be empty or contain initial mock data if needed
    keywords: ['mock', 'ocr', 'text'],
    insights: 'Mock insights.',
  };
});

// Mock other functions if they are used and need to be controlled in tests
export const sendChatMessage = jest.fn(async (message: string) => {
  console.log('MOCKED sendChatMessage called with:', message.substring(0, 50) + '...');
  return JSON.stringify([
    {
      creditor_name: 'Mock Chat Creditor',
      account_number: '111222333',
      account_balance: '$750',
      created_at: new Date().toISOString(),
      credit_limit: '$0',
      monthly_payment: '$0',
      date_opened: '05/01/2021',
      is_negative: false,
      account_type: 'loan',
      account_status: 'open',
      credit_bureau: 'experian',
      dispute_count: 0,
      rawText: 'Mock chat tradeline data',
    },
  ]);
});

export const generateContent = jest.fn(async (contents: any[]) => {
  console.log('MOCKED generateContent called with:', contents[0].parts[0].text.substring(0, 50) + '...');
  return 'Mock generated content.';
});

export const extractTradelineData = jest.fn(async (text: string) => {
    console.log('MOCKED extractTradelineData called with:', text.substring(0, 50) + '...');
    return {
        creditor_name: 'Mock Single Tradeline',
        account_number: '555555555',
        account_balance: '$100',
        created_at: new Date().toISOString(),
        credit_limit: '$0',
        monthly_payment: '$10',
        date_opened: '01/01/2022',
        is_negative: false,
        account_type: 'credit_card',
        account_status: 'open',
        credit_bureau: 'transunion',
        dispute_count: 0,
        rawText: 'Mock single tradeline text',
    };
});

export const parseTradelineWithRetry = jest.fn(async (entry: string) => {
    console.log('MOCKED parseTradelineWithRetry called with:', entry.substring(0, 50) + '...');
    return {
        creditor_name: 'Mock Retry Tradeline',
        account_number: '666666666',
        account_balance: '$200',
        created_at: new Date().toISOString(),
        credit_limit: '$0',
        monthly_payment: '$20',
        date_opened: '02/02/2023',
        is_negative: false,
        account_type: 'loan',
        account_status: 'open',
        credit_bureau: 'equifax',
        dispute_count: 0,
        rawText: 'Mock retry tradeline text',
    };
});

export class GoogleGeminiParser {
  constructor() {
    console.log('MOCKED GoogleGeminiParser constructor called');
  }
  async parseTradelineWithGemini(text: string) {
    console.log('MOCKED parseTradelineWithGemini called with:', text.substring(0, 50) + '...');
    return {
        creditor_name: 'Mock Gemini Parser Tradeline',
        account_number: '777777777',
        account_balance: '$300',
        created_at: new Date().toISOString(),
        credit_limit: '$0',
        monthly_payment: '$30',
        date_opened: '03/03/2024',
        is_negative: false,
        account_type: 'credit_card',
        account_status: 'open',
        credit_bureau: 'experian',
        dispute_count: 0,
        rawText: 'Mock Gemini parser tradeline text',
    };
  }
}