
// src/functions/ai-letter-generator/index.ts
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
    console.log(`User data provided: ${JSON.stringify(userData)}`);
    
    // Determine bureau address based on input
    const bureauAddresses = {
      'Experian': 'Experian\nP.O. Box 4500\nAllen, TX 75013',
      'TransUnion': 'TransUnion Consumer Solutions\nP.O. Box 2000\nChester, PA 19016-2000',
      'Equifax': 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374'
    };
    
    const bureauAddress = bureauAddresses[bureau as keyof typeof bureauAddresses] || '';
    
    // Format the items for the letter
    const itemsText = items.map((item: any, index: number) => {
      return `Item ${index + 1}: ${item.creditorName}
Account Number: ${item.accountNumber}
Reason for Dispute: ${item.recommendedReason || item.reason || "This information is inaccurate"}`;
    }).join('\n\n');
    
    // Format user's personal information for the letter
    let userInfo = {};
    let userAddress = '[YOUR ADDRESS], [YOUR CITY], [YOUR STATE] [YOUR ZIP]';
    let userName = '[YOUR NAME]';
    
    if (userData) {
      userName = userData.fullName || userName;
      if (userData.address && userData.city && userData.state && userData.zip) {
        userAddress = `${userData.address}, ${userData.city}, ${userData.state} ${userData.zip}`;
      }
      
      userInfo = {
        name: userData.fullName || '[YOUR NAME]',
        address: userData.address || '[YOUR ADDRESS]',
        city: userData.city || '[YOUR CITY]',
        state: userData.state || '[YOUR STATE]',
        zip: userData.zip || '[YOUR ZIP]',
        phone: userData.phone || '[YOUR PHONE]',
        email: userData.email || '[YOUR EMAIL]',
        ssn_last_four: userData.ssnLastFour || '[LAST 4 SSN DIGITS]',
      };
      
      console.log(`Using user data in letter: ${userName} at ${userAddress}`);
    }
    
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
            Include all the required elements for a successful dispute.
            Be detailed and precise with the reasoning, providing custom language for each type of dispute.`
          },
          {
            role: "user",
            content: `Write a credit dispute letter to ${bureau} at their address: ${bureauAddress}.
            
            The letter should dispute these items:
            
            ${itemsText}
            
            Include the following in the letter:
            1. Request for investigation under FCRA Section 611
            2. Statement that these items are inaccurate or incomplete
            3. Request for removal of inaccurate information
            4. Request for updated credit report showing corrections
            5. Reminder of the 30-day investigation requirement
            
            The letter should be from ${userName} at ${userAddress}.
            Include the consumer's phone number: ${userInfo.phone || '[YOUR PHONE]'}
            Include the consumer's email address: ${userInfo.email || '[YOUR EMAIL]'}
            Include the last 4 digits of the consumer's SSN: ${userInfo.ssn_last_four || 'XXXX'}
            
            Make it formal, professional, and legally compliant with the FCRA.
            
            Note: The letter must mention that the consumer is including copies of their government-issued ID, Social Security card, and a recent utility bill to prove their identity.`
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
    
    // Generate suggestions based on letter content
    let suggestions = ["Consider adding certified mail tracking"];
    
    if (!letterContent.includes("certified mail")) {
      suggestions.push("Send via certified mail with return receipt");
    }
    
    if (!letterContent.toLowerCase().includes("section 611")) {
      suggestions.push("Add specific reference to FCRA Section 611");
    }
    
    if (!letterContent.toLowerCase().includes("30 day") && !letterContent.toLowerCase().includes("30-day")) {
      suggestions.push("Mention the 30-day investigation requirement");
    }
    
    if (!letterContent.toLowerCase().includes("id") || !letterContent.toLowerCase().includes("social security") || !letterContent.toLowerCase().includes("utility bill")) {
      suggestions.push("Mention that you're including copies of your ID, SSN card, and utility bill");
    }
    
    return new Response(JSON.stringify({
      content: letterContent,
      qualityScore,
      suggestions,
      userData: userInfo
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
