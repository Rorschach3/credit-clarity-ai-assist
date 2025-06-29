import { jest } from '@jest/globals';

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(async (params: any) => {
        console.log('MOCKED OpenAI chat.completions.create called with:', params);
        // Return a mock response that matches the expected structure from Upstage.ai API
        // This should return a JSON string as content, as parsePdfDocument expects it.
        const mockTradelines = [
          {
            account_name: "Mock Company",
            account_number: "12345",
            type: "credit_card",
            balance: 1000,
            status: "open",
            credit_limit: 5000,
            address: "123 Mock St",
          },
        ];
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({ tradelines: mockTradelines }),
              },
            },
          ],
        };
      }),
    },
  },
};

const OpenAI = jest.fn(() => mockOpenAI);

export default OpenAI;