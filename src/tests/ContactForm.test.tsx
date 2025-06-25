import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../components/Contact/ContactForm';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed for Link/Router context if any

describe('ContactForm', () => {
  it('renders all form fields', () => {
    render(
      <Router>
        <ContactForm />
      </Router>,
    );

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    render(
      <Router>
        <ContactForm />
      </Router>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    render(
      <Router>
        <ContactForm />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'This is a test message for the contact form.' } });

    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Invalid email address/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Message must be at least 10 characters/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sending.../i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument(); // Button reverts after submission
    }, { timeout: 2000 }); // Wait a bit longer for the simulated async operation
  });
});