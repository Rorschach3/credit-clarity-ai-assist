import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { MockAuthProvider } from './mocks/mock-auth-context';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

import { User } from '@supabase/supabase-js'; // Import User type

// Mock window.matchMedia for next-themes directly in test-utils
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockUser: User = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'test@example.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
  identities: [],
};

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <MockAuthProvider initialUser={mockUser}>
          {children}
        </MockAuthProvider>
      </ThemeProvider>
    </Router>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react'; // Re-export everything from @testing-library/react
export { customRender as render }; // Override render with our custom one