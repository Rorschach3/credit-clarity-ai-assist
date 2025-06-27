import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'supabase/';
import { z } from 'zod/'; // Use the import map for zod

// Replicate the ParsedTradelineSchema for validation within the Edge Function
const ParsedTradelineSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(), // user_id is required here
  creditor_name: z.string().min(1).default(""),
  account_number: z.string().min(1).default(""),
  account_balance: z.string().default("$0"),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  credit_limit: z.string().default("$0"),
  monthly_payment: z.string().default("$0"),
  date_opened: z.string().default("xxxx/xx/xx"),
  is_negative: z.boolean().default(false),
  account_type: z.enum(["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", ""]).default("credit_card"),
  account_status: z.enum(["open", "closed", "in_collection", "charged_off", "disputed", ""]).default("open"),
  credit_bureau: z.enum(["equifax", "transunion", "experian"]).default(""),
  dispute_count: z.number().int().min(0).default(0),
  raw_text: z.string().default(""),
});

const RequestBodySchema = z.object({
  tradelines: z.array(ParsedTradelineSchema),
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { url, headers } = req;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'x-supabase-user-agent': 'supabase-edge-function' } },
        auth: { persistSession: false },
      }
    );

    // Get the user from the Supabase auth header
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No user found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { tradelines } = await req.json();

    const validationResult = RequestBodySchema.safeParse({ tradelines });

    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.errors);
      return new Response(JSON.stringify({
        error: "Invalid data format",
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare tradelines for UPSERT operation
    const tradelinesToUpsert = validationResult.data.tradelines.map(tl => ({
      ...tl,
      user_id: user.id, // Ensure user_id is set from authenticated user
      created_at: tl.created_at || new Date().toISOString(), // Ensure created_at is set if not provided
      id: tl.id || crypto.randomUUID(), // Ensure ID is set, will be ignored if conflict occurs and updated
      raw_text: tl.raw_text, // Ensure raw_text is passed correctly
    }));

    // Use upsert to handle duplicates based on a composite unique key
    const { data, error } = await supabaseClient
      .from('tradelines')
      .upsert(tradelinesToUpsert, {
        onConflict: 'user_id, creditor_name, account_number, account_type', // Composite unique key for deduplication
        ignoreDuplicates: false // Set to false to update existing records on conflict
      })
      .select();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: "Tradelines added successfully", data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});