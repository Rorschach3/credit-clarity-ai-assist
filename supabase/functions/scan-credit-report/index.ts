import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { OpenAI } from "https://esm.sh/openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("VITE_SUPABASE_URL") ?? "",
    Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;

    const { reportId } = await req.json();
    if (!reportId) throw new Error("Missing reportId");

    // Fetch the credit report file path from DB
    const { data: reportData, error: reportError } = await supabaseClient
      .from("credit_reports")
      .select("file_path")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (reportError || !reportData) throw new Error("Credit report not found");

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("credit-reports")
      .download(reportData.file_path);

    if (downloadError || !fileData) throw new Error("Failed to download credit report");

    // Read file content as text (assuming PDF text extraction done elsewhere or via AI)
    const fileText = new TextDecoder().decode(await fileData.arrayBuffer());

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get("VITE_OPENAI_API_KEY") ?? "",
    });

    // Call OpenAI or Gemini model to analyze text and extract negative accounts
    const prompt = `Extract negative credit accounts from the following credit report text:\n\n${fileText}\n\nReturn a JSON array of negative accounts with fields: bureau, accountName, balance, status, reason.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const content = completion.choices[0].message?.content;
    if (!content) throw new Error("No response from AI model");

    let negativeAccounts;
    try {
      negativeAccounts = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    // Save negative accounts to DB
    for (const account of negativeAccounts) {
      await supabaseClient.from("negative_accounts").upsert({
        user_id: user.id,
        bureau: account.bureau,
        account_name: account.accountName,
        balance: account.balance,
        status: account.status,
        reason: account.reason,
        report_id: reportId,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ message: "Scan complete", negativeAccounts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});