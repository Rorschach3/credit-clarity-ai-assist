import { jest } from '@jest/globals';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/integrations/supabase/types';

// Mock the entire supabase client object
const mockSupabaseClient: Partial<SupabaseClient<Database>> = {
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com' } }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com' } }, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com' } }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com' } } } as any, error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  } as any, // Cast to any to bypass type strictness for partial mocks

  from: jest.fn((tableName: string) => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [{ id: 'mock-data-id', table: tableName, user_id: '00000000-0000-4000-8000-000000000001' }], // Ensure user_id for tradelines
        error: null,
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => ({
          data: [{ id: 'mock-data-id', table: tableName, user_id: 'mock-user-id' }],
          error: null,
        })),
      })),
    })),
    insert: jest.fn(() => ({
      data: [{ id: 'mock-insert-id' }],
      error: null,
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [{ id: 'mock-update-id' }],
        error: null,
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })) as any, // Cast to any

  functions: {
    invoke: jest.fn((functionName: string) => {
      if (functionName === 'add-tradeline') {
        return Promise.resolve({ data: { message: 'Tradelines added successfully', count: 2 }, error: null });
      }
      return Promise.resolve({ data: {}, error: { message: 'Mock function not found' } });
    }),
  } as any, // Cast to any

};

export const supabase = mockSupabaseClient as SupabaseClient<Database>;