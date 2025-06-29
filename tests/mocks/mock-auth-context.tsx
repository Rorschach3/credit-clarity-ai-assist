import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

// Define a minimal mock AuthContextType
interface MockAuthContextType {
  user: User | null;
  isLoading: boolean;
  login: jest.Mock;
  signup: jest.Mock;
  logout: jest.Mock;
  signOut: jest.Mock;
}

// Create a mock AuthContext
const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

// Create a mock useAuth hook
export const mockUseAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('mockUseAuth must be used within a MockAuthProvider');
  }
  return context;
};

// Create a mock AuthProvider
export const MockAuthProvider = ({ children, initialUser = null, initialLoading = false }: { children: React.ReactNode; initialUser?: User | null; initialLoading?: boolean }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);

  // Mock functions
  const login = jest.fn(async (email, password) => {
    // Simulate a successful login
    if (email === 'test@example.com' && password === 'password') {
      const mockUser: User = {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'test@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        identities: [],
      };
      setUser(mockUser);
      return { error: undefined };
    }
    return { error: new Error('Invalid credentials') };
  });

  const signup = jest.fn(async (email, password) => {
    // Simulate a successful signup
    if (email && password) {
      const mockUser: User = {
        id: '00000000-0000-4000-8000-000000000001',
        email: email,
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        identities: [],
      };
      setUser(mockUser);
      return { error: undefined };
    }
    return { error: new Error('Signup failed') };
  });

  const logout = jest.fn(async () => {
    setUser(null);
  });

  const signOut = logout; // Alias

  useEffect(() => {
    setIsLoading(initialLoading); // Set initial loading state
    setUser(initialUser); // Set initial user state
  }, [initialUser, initialLoading]);

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    signOut,
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};