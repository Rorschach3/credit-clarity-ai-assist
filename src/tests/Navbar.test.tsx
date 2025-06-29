import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { ThemeProvider } from '@/components/theme-provider'; // Adjust path if needed

describe('Navbar', () => {
  it('renders navigation links correctly', () => {
    render(
      <Router>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Navbar />
        </ThemeProvider>
      </Router>,
    );

    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign-Out/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  it('renders the business name', () => {
    render(
      <Router>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Navbar />
        </ThemeProvider>
      </Router>,
    );
    expect(screen.getByText(/CreditClarity/i)).toBeInTheDocument();
  });

  // Add more tests for scroll behavior, mobile menu, theme toggle interaction if needed
});