import { parseTradelinesFromText } from './tradelineParser';

describe('parseTradelinesFromText', () => {
  it('should correctly parse a valid tradeline', () => {
    const input = `CHASE CARD
Account Number: 1234
Status: open account
Balance: $1000
Date Opened: 01/01/2020`;

    const result = parseTradelinesFromText(input);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].accountCondition).toBe('Good');
  });

  it('should correctly identify a negative tradeline', () => {
    const input = `CHASE CARD
Account Number: 1234
Status: charged off
Balance: $0
Date Opened: 01/01/2020`;

    const result = parseTradelinesFromText(input);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].accountCondition).toBe('chargedOff');
  });

  it('should reject invalid tradelines', () => {
    const input = `Invalid Tradeline`;

    const result = parseTradelinesFromText(input);
    expect(result.rejected).toHaveLength(1);
  });
});