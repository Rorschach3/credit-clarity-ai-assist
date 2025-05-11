
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FaqPage from "@/pages/FaqPage";
import PricingPage from "@/pages/PricingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminRoute from "@/components/auth/AdminRoute";
import PlaceholderDashboard from "@/pages/PlaceholderDashboard";
import AdminPage from "@/pages/AdminPage";
import DisputeGeneratorPage from "@/pages/DisputeGeneratorPage";
import FeaturesPage from "@/pages/FeaturesPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const { isLoading } = useAuth();
  const theme = "system"

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      disableTransitionOnChange
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/placeholder-dashboard" element={<PlaceholderDashboard />} />
          <Route path="/dispute-generator" element={<DisputeGeneratorPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;
