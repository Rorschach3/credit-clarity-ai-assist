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
            tradelines: [
              {
                account_name: 'Test Bank',
                account_number: '1234567890',
                type: 'credit_card',
                balance: 1000,
                status: 'open',
                credit_limit: 5000,
                address: '123 Test St',
              },
            ],
          }),
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse a PDF document and return account information', async () => {
    const mockBase64Encoded = 'base64encodedpdfcontent';
    const mockPdfPath = '/path/to/test.pdf';

    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(mockBase64Encoded));
    
    // The mock for OpenAI is global, so no need to mock specific instances here.
    // Ensure that the global mock is set up to return mockExtractionResponse.
    // This is handled by src/__mocks__/openai.ts now.

    const result = await parsePdfDocument(mockPdfPath, 'test-api-key');
    const parsedResult = JSON.parse(result as string); // Parse the JSON string

    expect(parsedResult).toBeDefined();
    expect(parsedResult.tradelines).toHaveLength(1);
    expect(parsedResult.tradelines[0].account_name).toBe('Mock Company');
  });
});