import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { ThemeProvider } from '../components/theme-provider'; // Adjust path if needed

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
    expect(screen.getByText(/Services/i)).toBeInTheDocument();
    expect(screen.getByText(/Process/i)).toBeInTheDocument();
    expect(screen.getByText(/Testimonials/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
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