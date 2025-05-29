import { parseTradelinesFromText } from './tradelineParser';

describe('parseTradelinesFromText', () => {
  it('should parse a valid tradeline', () => {
    const text = `CHASE CARD
Account Number: 1234567890
Status: Paid as agreed`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].creditorName).toBe('CHASE CARD');
    expect(tradelines[0].accountNumber).toBe('1234567890');
    expect(tradelines[0].status).toBe('Unknown');
    expect(tradelines[0].isNegative).toBe(false);
    expect(tradelines[0].negativeReason).toBeUndefined();
    expect(tradelines[0].rawText).toBe(text.trim());
  });

  it('should parse a negative tradeline', () => {
    const text = `BANK OF AMERICA
Account Number: XXXXXXXXXXXX
Status: Charge Off`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].isNegative).toBe(true);
    expect(tradelines[0].negativeReason).toContain('Charge Off');
  });

  it('should handle unknown creditor', () => {
    const text = `Some Unknown Bank
Account Number: N/A
Status: Paid as agreed`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].creditorName).toBe('Some Unknown Bank');
  });

  it('should handle missing account number', () => {
    const text = `DISCOVER
Status: Paid as agreed`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].accountNumber).toBe('N/A');
  });

  it('should handle multiple tradelines', () => {
    const text = `CHASE CARD
Account Number: 1234567890
Status: Paid as agreed

BANK OF AMERICA
Account Number: XXXXXXXXXXXX
Status: Charge Off`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(2);
    expect(tradelines[0].creditorName).toBe('CHASE CARD');
    expect(tradelines[1].creditorName).toBe('BANK OF AMERICA');
  });

  it('should handle different account number formats', () => {
    const text = `CITIBANK
Account Number: XXXX-1234
Status: Paid as agreed`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].accountNumber).toBe('1234');
  });

  it('should handle different status formats', () => {
    const text = `WELLS FARGO
Account Number: 1234567890
Status: Account in good standing`;
    const tradelines = parseTradelinesFromText(text);
    expect(tradelines).toHaveLength(1);
    expect(tradelines[0].status).toBe('Unknown');
  });
});