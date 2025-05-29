
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
    
    const { extractedText } = await req.json();
    if (!extractedText || !extractedText.structuredData || !extractedText.structuredData.accounts) {
      throw new Error('Missing or invalid extracted text data');
    }

    console.log(`Analyzing credit report with ${extractedText.structuredData.accounts.length} accounts`);
    
    // Send the data to OpenAI for analysis
    const openaiResponse = await fetch('https://api.openai.com/chat/completions', {
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
            content: "You are an expert credit analyst specializing in identifying items to dispute on credit reports. Analyze the provided credit report data and identify the most disputable negative items. For each negative item, suggest the most effective dispute reason."
          },
          {
            role: "user",
            content: `Analyze these accounts from a credit report and identify which ones are most suitable for dispute. Provide dispute reasons for each. Here are the accounts: ${JSON.stringify(extractedText.structuredData.accounts)}`
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
    const analysisText = openaiData.choices[0].message.content;

    // Process the accounts to identify negative items and recommendations
    // In a real implementation, this would be more sophisticated
    const accounts = extractedText.structuredData.accounts;
    const negativeItems = accounts.filter(account => 
      account.reason?.includes('Late') || 
      account.reason?.includes('Collection') || 
      account.reason?.includes('Charge-off') ||
      account.reason?.includes('Derogatory')
    );
    
    // Identify the most promising dispute opportunities
    const recommendedDisputes = negativeItems
      .filter(item => item.score && item.score > 50)
      .map(item => ({
        ...item,
        recommendedReason: determineDisputeReason(item, analysisText)
      }));
    
    return new Response(JSON.stringify({
      negativeItems,
      recommendedDisputes,
      analysisNotes: analysisText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI report analysis:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error in report analysis' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to determine dispute reason based on account and AI analysis
function determineDisputeReason(account: any, analysisText: string) {
  // Extract dispute reason for this account from AI analysis
  const accountMention = analysisText.split(/\n\n|\n/).find(
    paragraph => paragraph.includes(account.creditorName)
  );
  
  if (accountMention && accountMention.includes('Reason:')) {
    return accountMention.split('Reason:')[1].trim();
  }
  
  // Default dispute reasons based on account type if not found in analysis
  if (account.reason?.includes('Collection')) {
    return 'This account does not belong to me / I do not recognize this debt';
  } else if (account.reason?.includes('Late Payment')) {
    return 'I have always paid this account on time / The late payment is inaccurate';
  } else if (account.reason?.includes('Charge-off')) {
    return 'The balance information is incorrect / This account was settled';
  } else {
    return 'The information reported is not accurate';
  }
}
