
import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { SubscriberWithFeatures } from "@/integrations/supabase/schema";

interface SubscriptionPromptProps {
  onSubscribe: () => void;
}

export function SubscriptionPrompt({ onSubscribe }: SubscriptionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriberWithFeatures | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check subscription status when component mounts if user is logged in
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      if (data?.subscribed) {
        setSubscription(data as SubscriberWithFeatures);
        // If the user already has an active subscription, allow access
        onSubscribe();
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err);
    }
  };

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
      
      // Check if the user has a free plan first
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription');
      
      if (checkError) throw new Error(checkError.message);
      
      // If user already has a subscription (including free), proceed
      if (checkData?.subscribed) {
        toast.success("You already have access to this feature");
        onSubscribe();
        return;
      }
      
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

  // If the user already has access, don't show the prompt
  if (subscription?.subscribed) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription Required</CardTitle>
        <CardDescription>
          Upload and analyze your credit reports with our AI-powered system
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-6">
          Subscribe to access our AI-powered credit report analysis and dispute letter generation
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default" 
            onClick={handleQuickSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Subscribe Now"}
          </Button>
          <Button variant="outline" onClick={handleViewPlans}>
            View All Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
