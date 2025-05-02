
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if the user is on a free tier already
    const { data: existingSubscriber } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();
      
    // If the user has a free tier subscription, return it
    if (existingSubscriber && existingSubscriber.subscription_tier === "free") {
      logStep("User has free tier subscription", { 
        subscriptionTier: "free", 
        maximumDisputeLetters: 1 
      });
      
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "free",
        maximum_dispute_letters: 1,
        includes_creditor_disputes: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // If no Stripe key is set, we assume this is a development environment and default to free tier
      logStep("No Stripe key set, defaulting to free tier");
      
      // Update the subscriber to free tier
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: true,
        subscription_tier: "free",
        maximum_dispute_letters: 1,
        includes_creditor_disputes: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "free",
        maximum_dispute_letters: 1,
        includes_creditor_disputes: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, setting to free tier");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: "free",
        maximum_dispute_letters: 1,
        includes_creditor_disputes: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "free",
        maximum_dispute_letters: 1,
        includes_creditor_disputes: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = "free";
    let subscriptionEnd = null;
    let maximumDisputeLetters = 1;
    let includesCreditorDisputes = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Get price information
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const priceData = price.lookup_key || priceId;
      
      // Determine subscription tier from price
      if (priceData.includes("plus")) {
        subscriptionTier = "plus";
        maximumDisputeLetters = 8; // Up to 8 dispute items
        includesCreditorDisputes = false;
      } else if (priceData.includes("pro")) {
        subscriptionTier = "pro";
        maximumDisputeLetters = 8; // Up to 8 dispute items
        includesCreditorDisputes = true;
      } else {
        // Default to free tier if price doesn't match known tiers
        subscriptionTier = "free";
        maximumDisputeLetters = 1;
        includesCreditorDisputes = false;
      }
      
      logStep("Determined subscription tier", { 
        priceId, 
        subscriptionTier, 
        maximumDisputeLetters, 
        includesCreditorDisputes 
      });
    } else {
      logStep("No active subscription found, setting to free tier");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: true, // Everyone has at least free tier access
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      maximum_dispute_letters: maximumDisputeLetters,
      includes_creditor_disputes: includesCreditorDisputes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", {
      subscribed: true,
      subscriptionTier,
      maximumDisputeLetters,
      includesCreditorDisputes
    });
    
    return new Response(JSON.stringify({
      subscribed: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      maximum_dispute_letters: maximumDisputeLetters,
      includes_creditor_disputes: includesCreditorDisputes
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
