import { parsePdfDocument } from '@/utils/pdf-parser';
import { ParsedTradelineSchema, saveTradelinesToDatabase } from '@/utils/tradelineParser'; // Import saveTradelinesToDatabase
import { extractAllTradelines } from '@/services/llm-parser';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Explicitly mock modules
jest.mock('@/utils/pdf-parser');
jest.mock('@/integrations/supabase/client');
jest.mock('@/services/llm-parser', () => ({
  extractAllTradelines: jest.fn(),
}));
jest.mock('@/utils/tradelineParser', () => ({
  ...jest.requireActual('@/utils/tradelineParser'), // Keep other exports
  saveTradelinesToDatabase: jest.fn(), // Mock this specific function
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
}));

describe('PDF Parser Tradeline Extraction and LLM Integration', () => {
  const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Use a valid UUID for user ID

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for the scenario where raw PDF text is processed by LLM
  it('should extract multiple tradelines from raw PDF text using LLM', async () => {
    const mockPdfText = "Here is some credit report text. Creditor A: Account 123, Balance $1000. Creditor B: Account 456, Balance $2000.";
    const mockParsedTradelines = [
      ParsedTradelineSchema.parse({
        id: uuidv4(),
        creditor_name: 'Creditor A',
        account_number: '123',
        account_balance: '$1000',
        account_type: 'credit_card',
        account_status: 'open',
        is_negative: false,
        rawText: 'Creditor A: Account 123, Balance $1000',
        user_id: mockUserId,
      }),
      ParsedTradelineSchema.parse({
        id: uuidv4(),
        creditor_name: 'Creditor B',
        account_number: '456',
        account_balance: '$2000',
        account_type: 'loan',
        account_status: 'open',
        is_negative: false,
        rawText: 'Creditor B: Account 456, Balance $2000',
        user_id: mockUserId,
      }),
    ];

    // Mock the behavior of extractAllTradelines directly
    (extractAllTradelines as jest.Mock).mockResolvedValueOnce(mockParsedTradelines);

    // Explicitly mock parsePdfDocument to return expected structure
    (parsePdfDocument as jest.Mock).mockResolvedValueOnce({
      text: mockPdfText,
      tradelines: [ // Use tradelines as per the updated schema
        { account_name: 'Test Bank', account_number: '123', type: 'credit_card', balance: 1000, status: 'open' }
      ]
    });

    const { parseTradelinesFromText } = await import('@/utils/tradelineParser');

    const resultTradelines = await parseTradelinesFromText(mockPdfText, mockUserId, {});

    expect(extractAllTradelines).toHaveBeenCalledTimes(1);
    expect(extractAllTradelines).toHaveBeenCalledWith(mockPdfText, undefined, undefined);

    expect(resultTradelines).toHaveLength(2);
    expect(resultTradelines[0].creditor_name).toBe('Creditor A');
    expect(resultTradelines[1].account_number).toBe('456');
  });

  it('should save all tradelines to Supabase', async () => {
    const mockedSupabase = supabase; // Access the globally mocked supabase object
    
    // Configure the mock behavior for the test
    (mockedSupabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
    });
    (mockedSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: mockUserId } }, error: null });

    const tradelinesToSave = [
      ParsedTradelineSchema.parse({
        id: uuidv4(),
        creditor_name: 'Creditor X',
        account_number: '789',
        account_balance: '$500',
        account_type: 'credit_card',
        account_status: 'open',
        is_negative: false,
        rawText: 'Some raw text',
        user_id: mockUserId,
      }),
    ];

    const { saveTradelinesToDatabase } = await import('@/utils/tradelineParser');
    
    const result = await saveTradelinesToDatabase(tradelinesToSave, mockUserId);

    expect(mockedSupabase.from).toHaveBeenCalledWith('tradelines');
    // Using toBeCalledWith with objectContaining for partial match
    expect((mockedSupabase.from('tradelines') as any).upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          creditor_name: 'Creditor X',
          user_id: mockUserId,
        })
      ])
    );
    expect(result).toBeDefined();
  });
});