
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { SubscriberWithFeatures } from "@/integrations/supabase/schema";

interface SubscriptionPromptProps {
  onSubscribe: () => void;
  featureName?: string;
}

export function SubscriptionPrompt({ 
  onSubscribe, 
  featureName = "advanced features" 
}: SubscriptionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriberWithFeatures | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewPlans = () => {
    navigate("/pricing");
  };

  const handleQuickSubscribe = async () => {
    if (!user) {
      toast.info("Please log in to subscribe");
      navigate("/login", { state: { returnTo: "/dispute-generator" } });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the Plus plan as the default quick subscribe option
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_plus_monthly' },
      });
      
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No checkout URL returned");
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error("Could not initiate subscription process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // For free features, we can just proceed without a subscription check
  setTimeout(onSubscribe, 0);
  return null;
}
