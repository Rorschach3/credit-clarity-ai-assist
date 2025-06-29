import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, PostgrestError } from '@supabase/supabase-js'; // Use the correct supabase-js import
import { z } from 'zod'; // Use the import map for zod, remove trailing slash

// Add this type definition, derived from the schema
type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

// Define a type for the data fetched from the database for existing tradelines
interface ExistingTradelineQueryResult {
id: string;
creditor_name: string;
account_number: string;
account_type: string;
}

// Replicate the ParsedTradelineSchema for validation within the Edge Function
const ParsedTradelineSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(), // user_id is required here
  creditor_name: z.string().default(""),
  account_number: z.string().default(""),
  account_balance: z.string().default("$0"),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  credit_limit: z.string().default("$0"),
  monthly_payment: z.string().default("$0"),
  date_opened: z.string().default("xxxx/xx/xx"),
  is_negative: z.boolean().default(false),
  account_type: z.enum(["credit_card", "loan", "mortgage", "auto_loan", "student_loan", "collection", "", "other"]).default("credit_card"),
  account_status: z.enum(["open", "closed", "in_collection", "charged_off", "disputed"]).default("open"),
  credit_bureau: z.enum(["equifax", "transunion", "experian", ""]).default(""),
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

    const tradelinesToInsert: ParsedTradeline[] = [];
    const tradelinesToUpdate: ParsedTradeline[] = [];

    // Fetch existing tradelines for the user to determine if an upsert is needed
    const { data: existingTradelines, error: fetchError } = await supabaseClient
      .from('tradelines')
      .select('id, creditor_name, account_number, account_type')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error("Database fetch error for existing tradelines:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingTradelineMap = new Map();
    if (existingTradelines) {
      existingTradelines.forEach((tl: ExistingTradelineQueryResult) => {
        const key = `${tl.creditor_name}-${tl.account_number}-${tl.account_type}`;
        existingTradelineMap.set(key, tl.id);
      });
    } // Added missing closing brace

    for (const tl of validationResult.data.tradelines) {
      const tradelineKey = `${tl.creditor_name}-${tl.account_number}-${tl.account_type}`;
      const existingId = existingTradelineMap.get(tradelineKey);

      const commonFields = {
        user_id: user.id,
        creditor_name: tl.creditor_name,
        account_number: tl.account_number,
        account_balance: tl.account_balance,
        credit_limit: tl.credit_limit,
        monthly_payment: tl.monthly_payment,
        date_opened: tl.date_opened,
        is_negative: tl.is_negative,
        account_type: tl.account_type,
        account_status: tl.account_status,
        credit_bureau: tl.credit_bureau,
        dispute_count: tl.dispute_count,
        raw_text: tl.raw_text,
      };

      if (existingId) {
        // If an existing tradeline is found, prepare for update
        tradelinesToUpdate.push({
          ...commonFields,
          id: existingId, // Use the existing ID for the update
          created_at: tl.created_at || new Date().toISOString(),
        });
      } else {
        // If no existing tradeline, prepare for insert
        tradelinesToInsert.push({
          ...commonFields,
          id: crypto.randomUUID(), // Generate new ID for new record
          created_at: tl.created_at || new Date().toISOString(),
        });
      }
    }

    let insertResult: { data: ParsedTradeline[]; error: PostgrestError | null } = { data: [], error: null };
    if (tradelinesToInsert.length > 0) {
      console.log(`Attempting to insert ${tradelinesToInsert.length} new tradelines.`);
      insertResult = await supabaseClient
        .from('tradelines')
        .insert(tradelinesToInsert)
        .select();
      
      if (insertResult.error) {
        console.error("Database insert error for new tradelines:", insertResult.error);
        throw insertResult.error;
      }
    }

    const updateResult: { data: ParsedTradeline[]; error: PostgrestError | null } = { data: [], error: null };
    if (tradelinesToUpdate.length > 0) {
      console.log(`Attempting to update ${tradelinesToUpdate.length} existing tradelines.`);
      // Perform updates individually or in batches if Supabase supports it more efficiently
      // For simplicity, updating one by one for now.
      for (const updateTl of tradelinesToUpdate) {
        const { data: updatedData, error: updateError } = await supabaseClient
          .from('tradelines')
          .update(updateTl)
          .eq('id', updateTl.id)
          .select();
        
        if (updateError) {
          console.error(`Database update error for tradeline ID ${updateTl.id}:`, updateError);
          throw updateError;
        }
        updateResult.data.push(updatedData[0]);
      }
    }

    const data = [...(insertResult.data || []), ...(updateResult.data || [])];
    const error = insertResult.error || updateResult.error; // Consolidate errors

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