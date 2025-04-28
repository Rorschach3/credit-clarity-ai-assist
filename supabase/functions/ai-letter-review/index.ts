
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
    
    const { letterContent, bureau } = await req.json();
    if (!letterContent || !bureau) {
      throw new Error('Missing required parameters');
    }

    console.log(`Reviewing dispute letter for ${bureau}`);
    
    // Send to OpenAI for review and improvement
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
            content: `You are an expert credit attorney specializing in credit dispute letters. Review the provided dispute letter for legal compliance, effectiveness, clarity, and persuasiveness. Suggest improvements if needed. If the letter seems effective and compliant, return it unchanged.`
          },
          {
            role: "user",
            content: `Review this dispute letter to ${bureau} for legal compliance and effectiveness. Improve it if needed:

${letterContent}`
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
    const reviewedContent = openaiData.choices[0].message.content;
    
    // Extract the improved letter and suggestions
    let improvedLetter = reviewedContent;
    let suggestions = [];
    
    // If the response includes both suggestions and the letter
    if (reviewedContent.includes("SUGGESTIONS:")) {
      const parts = reviewedContent.split("SUGGESTIONS:");
      if (parts.length > 1) {
        improvedLetter = parts[0].trim();
        suggestions = parts[1].trim().split("\n").filter(s => s.trim().length > 0);
      }
    } else if (reviewedContent.includes("Suggestions:")) {
      const parts = reviewedContent.split("Suggestions:");
      if (parts.length > 1) {
        improvedLetter = parts[0].trim();
        suggestions = parts[1].trim().split("\n").filter(s => s.trim().length > 0);
      }
    }
    
    // Calculate a quality score (in a real implementation this would be more sophisticated)
    // Base score is high if the letter wasn't changed much
    const similarityScore = calculateSimilarity(letterContent, improvedLetter);
    const qualityScore = suggestions.length > 0 ? 85 : 95;
    
    return new Response(JSON.stringify({
      content: improvedLetter,
      qualityScore,
      suggestions: suggestions.length > 0 ? suggestions : ["No suggestions - letter meets quality standards"]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI letter review:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error in letter review' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Simple helper to calculate similarity between original and revised letter
function calculateSimilarity(original: string, revised: string): number {
  if (!original || !revised) return 0;
  
  // Remove whitespace and convert to lowercase for comparison
  const normalizedOriginal = original.replace(/\s+/g, ' ').toLowerCase().trim();
  const normalizedRevised = revised.replace(/\s+/g, ' ').toLowerCase().trim();
  
  // Calculate a simple similarity ratio based on letter length difference
  const lengthDifference = Math.abs(normalizedOriginal.length - normalizedRevised.length);
  const similarityRatio = 1 - (lengthDifference / Math.max(normalizedOriginal.length, normalizedRevised.length));
  
  return Math.round(similarityRatio * 100);
}
