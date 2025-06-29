// src/__mocks__/@/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Mock values for environment variables
const MOCK_SUPABASE_URL = 'http://mock-supabase-url';
const MOCK_SUPABASE_ANON_KEY = 'mock-supabase-anon-key';

// Create a mocked Supabase client
export const supabase = createClient(MOCK_SUPABASE_URL, MOCK_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Do not persist session in tests
    autoRefreshToken: false, // Do not refresh token in tests
    detectSessionInUrl: false, // Do not detect session in URL in tests
  },
});

// Mock the auth object and its methods
supabase.auth = {
  ...supabase.auth, // Keep existing properties
  signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id', email: 'test@example.com' } }, error: null })),
  signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id', email: 'test@example.com' } }, error: null })),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'mock-user-id', email: 'test@example.com' } } } as any, error: null })),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
} as any;

// Mock the from method for database operations
supabase.from = jest.fn((tableName: string) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      data: [{ id: 'mock-data-id', table: tableName }],
      error: null,
    })),
    order: jest.fn(() => ({
      limit: jest.fn(() => ({
        data: [{ id: 'mock-data-id', table: tableName }],
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
})) as any;