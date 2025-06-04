import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/MainLayout";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/DashboardPage";
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
import AdminPage from "@/pages/AdminPage";
import FeaturesPage from "@/pages/FeaturesPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import TradelinesPage from "@/pages/TradelinesPage";
import ProfilePage from "@/pages/ProfilePage";
import { Toaster } from "@/components/ui/toaster";
import BlogPage from "@/pages/BlogPage";
import BlogPost from "@/components/BlogPost";
import CreditReportUploadPage from "@/pages/CreditReportUploadPage";
import DisputeLetterPage from "@/pages/DisputeLetterPage";
import DisputePacketPage from "@/pages/DisputePacketPage";

import DisputeWizardPage from "@/pages/DisputeWizardPage";

function App() {
  const theme = "system";

  return (
    <AuthProvider>
      <InnerApp theme={theme} />
    </AuthProvider>
  );
}

function InnerApp({ theme }: { theme: string }) {
  const { isLoading } = useAuth();

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<HomePage />} />
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
          <Route path="/credit-report-upload" element={<CreditReportUploadPage />} />
          <Route path="/dispute-letter" element={<DisputeLetterPage />} />
          <Route path="/dispute-packet" element={<DisputePacketPage />} />
          <Route path="/tradelines" element={<MainLayout><TradelinesPage /></MainLayout>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/dispute-wizard" element={<DisputeWizardPage />} />
        </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    );
  }

export default App;
