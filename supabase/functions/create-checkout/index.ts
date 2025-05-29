import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.set(corsHeaders);
  next();
});

const logStep = (step: string, details?: unknown) => {
  const formatted = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${formatted}`);
};

app.post("/create-checkout", async (req, res) => {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });

  try {
    logStep("Function started");

    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string") {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user?.email) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { id: user.id, email: user.email });

    let customerId: string;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    const { priceId } = req.body;
    if (!priceId) throw new Error("Price ID is required");

    const priceMap: Record<string, string> = {
      price_basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY ?? "price_basic_monthly",
      price_basic_yearly: process.env.STRIPE_PRICE_BASIC_YEARLY ?? "price_basic_yearly",
      price_plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "price_plus_monthly",
      price_plus_yearly: process.env.STRIPE_PRICE_PLUS_YEARLY ?? "price_plus_yearly",
      price_pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_pro_monthly",
      price_pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "price_pro_yearly",
    };

    const stripePriceId = priceMap[priceId] ?? priceId;
    const origin = req.headers.origin ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/placeholder-dashboard?success=true`,
      cancel_url: `${origin}/pricing?success=false`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    logStep("Checkout session created", { sessionId: session.id });

    res.status(200).json({ url: session.url });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default app;
