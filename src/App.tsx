
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import PlaceholderDashboard from "./pages/PlaceholderDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";
import DisputeGeneratorPage from "./pages/DisputeGeneratorPage";

// Layouts
import MainLayout from "./components/layout/MainLayout";

// Auth components
import AdminRoute from "./components/auth/AdminRoute";

const queryClient = new QueryClient();

// Create AuthProvider to manage auth state
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create AuthContext
import { createContext, useContext } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false });

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <AuthRedirect />
              } 
            />
            <Route 
              path="/about" 
              element={
                <MainLayout>
                  <AboutPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <MainLayout>
                  <PricingPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <MainLayout>
                  <ContactPage />
                </MainLayout>
              } 
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/placeholder-dashboard" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <MainLayout>
                    <AdminPage />
                  </MainLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/dispute-generator" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DisputeGeneratorPage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Component to handle home page redirection based on auth status
const AuthRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (user) {
    return <Navigate to="/placeholder-dashboard" replace />;
  }
  
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
};

export default App;
