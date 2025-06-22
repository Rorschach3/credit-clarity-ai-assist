// src/utils/pdf-parser.test.ts
import { parsePdfDocument } from './pdf-parser';
import OpenAI from 'openai';
import fs from 'fs';

// Mock the dependencies
jest.mock('openai');
jest.mock('fs');

describe('parsePdfDocument', () => {
  const mockExtractionResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            accounts: [
              {
                creditor_name: 'Test Bank',
                account_number: '1234567890',
                balance: 1000,
                status: 'open'
              }
            ]
          })
        }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OpenAI constructor and its methods
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as unknown as jest.Mocked<OpenAI>;    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
  });

  it('should parse a PDF document and return account information', async () => {
    const mockBase64Encoded = 'base64encodedpdfcontent';
    const mockPdfPath = '/path/to/test.pdf';

    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(mockBase64Encoded));
    
    // Get the mocked instance and mock the method
    const mockInstance = new OpenAI({ apiKey: 'test' });
    (mockInstance.chat.completions.create as jest.Mock).mockResolvedValue(mockExtractionResponse);

    const result = await parsePdfDocument(mockPdfPath, 'test-api-key');

    expect(result).toBeDefined();
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].creditor_name).toBe('Test Bank');
  });
});