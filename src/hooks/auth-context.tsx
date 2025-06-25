// src/contexts/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Define the shape of our auth context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: unknown | null }>;
  signup: (email: string, password: string) => Promise<{ error: unknown | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: unknown | null }>;
  updatePassword: (password: string) => Promise<{ error: unknown | null }>;
  clearError: () => void;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps app and makes auth object available to any child component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = () => setError(null);

  // Initialize authentication state
  useEffect(() => {
    // Check active sessions and set the user
    const getSession = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Handle sign in
          } else if (event === 'SIGNED_OUT') {
          // Handle sign out
          } else if (event === 'USER_UPDATED') {
          // Handle user update
       }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Clear errors on successful auth state change
        if (session && error) {
          setError(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [error]);

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) setError(error.message);
    setIsLoading(false);
    
    return { error };
  };

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) setError(error.message);
    setIsLoading(false);
    
    return { error };
  };

  // Sign out
  const logout = async () => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setError(error.message);
    } else {
      setUser(null);
      setSession(null);
      setError(null);
    }
    
    setIsLoading(false);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) setError(error.message);
    setIsLoading(false);
    
    return { error };
  };

  // Update password
  const updatePassword = async (password: string) => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) setError(error.message);
    setIsLoading(false);
    
    return { error };
  };

  // Make the context object
  const value = {
    user,
    session,
    isLoading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    clearError,
  };
  
  // Provider component
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create useAuth hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};