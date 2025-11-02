/**
 * Unit tests for validateAndFormatTradeline utility
 */

import { validateAndFormatTradeline, validateAndFormatTradelines } from './validateAndFormat';
import { ParsedTradeline } from '../tradelineParser';

describe('validateAndFormatTradeline', () => {
  it('should format valid tradeline with all fields', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      creditor_name: 'Bank of America',
      account_number: '1234567890',
      account_type: 'Credit Card',
      account_balance: '1500',
      credit_limit: '5000',
      monthly_payment: '50',
      date_opened: '2020-01-01',
      account_status: 'Open',
      dispute_count: 0,
      is_negative: false,
      created_at: '2024-01-01T00:00:00Z',
      credit_bureau: 'Equifax',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.creditor_name).toBe('Bank of America');
    expect(result.account_balance).toBe('$1,500.00');
    expect(result.credit_limit).toBe('$5,000.00');
    expect(result.monthly_payment).toBe('$50.00');
    expect(result.account_number).toBe('1234567890');
    expect(result.is_negative).toBe(false);
    expect(result.dispute_count).toBe(0);
  });

  it('should provide defaults for missing string fields', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.creditor_name).toBe('N/A');
    expect(result.account_number).toBe('N/A');
    expect(result.account_type).toBe('N/A');
    expect(result.account_status).toBe('N/A');
    expect(result.date_opened).toBe('N/A');
    expect(result.credit_bureau).toBe('N/A');
  });

  it('should format currency fields to $0 when missing', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.account_balance).toBe('$0.00');
    expect(result.credit_limit).toBe('$0.00');
    expect(result.monthly_payment).toBe('$0.00');
  });

  it('should format currency strings with dollar signs', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      account_balance: '$1,234.56',
      credit_limit: '10000',
      monthly_payment: '250.50',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.account_balance).toBe('$1,234.56');
    expect(result.credit_limit).toBe('$10,000.00');
    expect(result.monthly_payment).toBe('$250.50');
  });

  it('should handle numeric values for currency fields', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      account_balance: 1234.56 as any,
      credit_limit: 5000 as any,
      monthly_payment: 100 as any,
    };

    const result = validateAndFormatTradeline(input);

    expect(result.account_balance).toBe('$1,234.56');
    expect(result.credit_limit).toBe('$5,000.00');
    expect(result.monthly_payment).toBe('$100.00');
  });

  it('should default boolean fields to false', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.is_negative).toBe(false);
  });

  it('should default numeric fields to 0', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.dispute_count).toBe(0);
  });

  it('should preserve boolean true value', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      is_negative: true,
    };

    const result = validateAndFormatTradeline(input);

    expect(result.is_negative).toBe(true);
  });

  it('should trim whitespace from string fields', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      creditor_name: '  Bank of America  ',
      account_number: '  1234567890  ',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.creditor_name).toBe('Bank of America');
    expect(result.account_number).toBe('1234567890');
  });

  it('should generate current timestamp for created_at if missing', () => {
    const input: Partial<ParsedTradeline> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = validateAndFormatTradeline(input);

    expect(result.created_at).toBeDefined();
    expect(typeof result.created_at).toBe('string');
    // Verify it's a valid ISO date
    expect(new Date(result.created_at).toISOString()).toBe(result.created_at);
  });
});

describe('validateAndFormatTradelines', () => {
  it('should format an array of tradelines', () => {
    const input: Partial<ParsedTradeline>[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        creditor_name: 'Bank A',
        account_balance: '1000',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        creditor_name: 'Bank B',
        account_balance: '2000',
      },
    ];

    const result = validateAndFormatTradelines(input);

    expect(result).toHaveLength(2);
    expect(result[0].creditor_name).toBe('Bank A');
    expect(result[0].account_balance).toBe('$1,000.00');
    expect(result[1].creditor_name).toBe('Bank B');
    expect(result[1].account_balance).toBe('$2,000.00');
  });

  it('should handle empty array', () => {
    const result = validateAndFormatTradelines([]);

    expect(result).toHaveLength(0);
  });
});
