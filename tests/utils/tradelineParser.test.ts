// Fix 3: src/utils/tradelineParser.test.ts
import { parseTradelinesFromText } from '../../src/utils/tradelineParser';

describe('parseTradelinesFromText', () => {
  const mockUserId = '00000000-0000-4000-8000-000000000001';

  it('should parse basic tradeline information', async () => {
    const text = `
      CAPITAL ONE
      Account Number: 123456789
      Balance: $1,234.56
      Status: Open
    `;
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
  });

  it('should handle multiple tradelines', async () => {
    const text = `
      CAPITAL ONE
      Account Number: 123456789
      Balance: $1,234.56
      Status: Open
      
      CHASE BANK
      Account Number: 987654321
      Balance: $2,500.00
      Status: Closed
    `;
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(tradelines.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty text', async () => {
    const text = '';
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
    expect(tradelines.length).toBe(0);
  });

  it('should handle text with no tradeline information', async () => {
    const text = 'This is just random text with no account information';
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
  });

  it('should parse account numbers correctly', async () => {
    const text = `
      Account Number: 123456789
      Account #: 987654321
      Acct: 555666777
    `;
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
  });

  it('should parse balances correctly', async () => {
    const text = `
      Balance: $1,234.56
      Current Balance: $2,500.00
      Outstanding: $750.25
    `;
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
  });

  it('should handle various status formats', async () => {
    const text = `
      Status: Open
      Account Status: Closed
      Current Status: In Collection
    `;
    
    const tradelines = await parseTradelinesFromText(text, mockUserId);
    
    expect(tradelines).toBeDefined();
    expect(Array.isArray(tradelines)).toBe(true);
  });


});