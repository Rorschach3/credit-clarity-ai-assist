import { render, screen } from '../../tests/test-utils'; // Import custom render
import { Navbar } from '@/components/layout/Navbar'; // Import Navbar

// Directly mock useAuth for this test file
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'mock-user-id', // Use a consistent mock user ID
      email: 'test@example.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
      identities: [],
    },
    isLoading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    signOut: jest.fn(),
  })),
}));

describe('Navbar', () => {
  it('renders navigation links correctly', () => {
    render(<Navbar />);

    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  it('renders the business name', () => {
    render(<Navbar />);
    expect(screen.getByText(/Credit Clarity/i)).toBeInTheDocument();
  });

  // Add more tests for scroll behavior, mobile menu, theme toggle interaction if needed
});