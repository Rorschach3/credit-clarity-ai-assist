
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('Missing OpenAI API key');
    }
    
    const { items, bureau, userData } = await req.json();
    if (!items || !items.length || !bureau) {
      throw new Error('Missing required parameters: items and bureau');
    }

    console.log(`Generating dispute letter for ${bureau} with ${items.length} items`);
    
    // Determine bureau address based on input
    const bureauAddresses = {
      'Experian': 'Experian\nP.O. Box 4500\nAllen, TX 75013',
      'TransUnion': 'TransUnion Consumer Solutions\nP.O. Box 2000\nChester, PA 19016-2000',
      'Equifax': 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374'
    };
    
    const bureauAddress = bureauAddresses[bureau as keyof typeof bureauAddresses] || '';
    
    // Format the items for the letter
    const itemsText = items.map((item, index) => {
      return `Item ${index + 1}: ${item.creditorName}
Account Number: ${item.accountNumber}
Reason for Dispute: ${item.recommendedReason || "This information is inaccurate"}`;
    }).join('\n\n');
    
    // Send request to OpenAI to generate letter
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at writing effective credit dispute letters under the Fair Credit Reporting Act (FCRA). 
            Create a formal, professional dispute letter to a credit bureau that is compliant with all legal requirements.
            Format the letter properly with addresses, date, subject line, and formal closure.
            Include all the required elements for a successful dispute.`
          },
          {
            role: "user",
            content: `Write a credit dispute letter to ${bureau} at their address: ${bureauAddress}.
            
            The letter should dispute these items:
            
            ${itemsText}
            
            Include a request for investigation under FCRA and removal of inaccurate information.
            The letter should be from ${userData?.name || '[YOUR NAME]'} at ${userData?.address || '[YOUR ADDRESS]'}.
            Make it formal, professional, and legally compliant with the FCRA.`
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

    // Quality check the letter (simulated for demo)
    const qualityScore = 95; // In a real implementation, this would be calculated
    const suggestions = ["Consider adding certified mail tracking", "Request investigation within 30 days"];
    
    return new Response(JSON.stringify({
      content: letterContent,
      qualityScore,
      suggestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI letter generation:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error in letter generation' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
