import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  ssnLastFour?: string;
}

interface CreditReportItem {
  creditorName: string;
  accountNumber: string;
  recommendedReason?: string;
  creditLimit?: string;
  balance?: string;
  paymentHistory?: string;
  type?: string;
  status?: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('VITE_OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error("Missing OpenAI API key");
      throw new Error('Missing OpenAI API key');
    }

    const { items, bureau, userData, disputeType, language = "en", tone = "formal" } = await req.json();
    if (!items || !items.length || !bureau || !disputeType) {
      throw new Error("Missing required parameters: items, bureau, and disputeType");
    }

    const bureauAddresses = {
      Experian: "Experian\nP.O. Box 4500\nAllen, TX 75013",
      TransUnion: "TransUnion Consumer Solutions\nP.O. Box 2000\nChester, PA 19016-2000",
      Equifax: "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374"
    };

    const bureauAddress = bureauAddresses[bureau as keyof typeof bureauAddresses] || "";
    const itemsText = items.map((item: CreditReportItem, index: number) => {
      return `Item ${index + 1}: ${item.creditorName}\nAccount Number: ${item.accountNumber}\nReason for Dispute: ${item.recommendedReason || item.reason || "This information is inaccurate"}`;
    }).join("\n\n");

    let userInfo: UserData = {};
    let userAddress = '[YOUR ADDRESS], [YOUR CITY], [YOUR STATE] [YOUR ZIP]';
    let userName = '[YOUR FIRST NAME] [YOUR LAST NAME]';

    if (userData) {
      userName = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userName;
      if (userData.address && userData.city && userData.state && userData.zip) {
        userAddress = `${userData.address}, ${userData.city}, ${userData.state} ${userData.zip}`;
      }

      userInfo = {
        firstName: userData.firstName || '[YOUR First NAME]',
        lastName: userData.lastName || '[YOUR LAST NAME]',
        address: userData.address || '[YOUR ADDRESS]',
        city: userData.city || '[YOUR CITY]',
        state: userData.state || '[YOUR STATE]',
        zip: userData.zip || '[YOUR ZIP]',
        phone: userData.phone || '[YOUR PHONE]',
        email: userData.email || '[YOUR EMAIL]',
        ssnLastFour: userData.ssnLastFour || 'XXXX',
      };
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: `You are an expert at writing effective credit dispute letters under the Fair Credit Reporting Act (FCRA), FDCPA, and FACTA.`
          },
          {
            role: "user",
            content: `Generate a credit dispute letter to ${bureau} at their address: ${bureauAddress} for the following items:\n\n${itemsText}\n\nUse a ${tone} tone and write in ${language}.`
          }
        ],
        max_tokens: 2048
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    const letterContent = openaiData.choices[0].message.content;
    const qualityScore = 95;
    const suggestions = ["Consider adding certified mail tracking"];

    if (!letterContent.includes("certified mail")) suggestions.push("Send via certified mail with return receipt");
    if (!letterContent.toLowerCase().includes("section 611")) suggestions.push("Add specific reference to FCRA Section 611");
    if (!letterContent.toLowerCase().includes("30 day") && !letterContent.toLowerCase().includes("30-day")) suggestions.push("Mention the 30-day investigation requirement");
    if (!letterContent.toLowerCase().includes("id") || !letterContent.toLowerCase().includes("social security") || !letterContent.toLowerCase().includes("utility bill")) suggestions.push("Mention that you're including copies of your ID, SSN card, and utility bill");

    return new Response(JSON.stringify({ content: letterContent, qualityScore, suggestions, userData: userInfo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Error in AI letter generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage || "Unknown error in letter generation" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
