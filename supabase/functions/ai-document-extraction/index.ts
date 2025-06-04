import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing necessary environment variables.');
    }

    const { fileUrl, fileType } = await req.json();
    if (!fileUrl || !fileType) {
      throw new Error('Missing required parameters: fileUrl or fileType.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let fileData: ArrayBuffer;

    if (fileUrl.includes('storage/v1')) {
      const pathParts = fileUrl.split('/storage/v1/object/public/')[1];
      const [bucket, ...filePathParts] = pathParts.split('/');
      const filePath = filePathParts.join('/');

      const { data: downloadData, error: downloadError } = await supabase
        .storage
        .from(bucket)
        .download(filePath);

      if (downloadError || !downloadData) {
        throw new Error(`Supabase download error: ${downloadError?.message || "Unknown error"}`);
      }

      fileData = await downloadData.arrayBuffer();
    } else {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Error downloading external file: ${response.statusText}`);
      }
      fileData = await response.arrayBuffer();
    }

    const base64Data = btoa(
      new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // recommended for vision tasks
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured information from credit reports. Identify all accounts, especially negative items. Include creditor names, account numbers, balances, payment status, and dates reported. Provide structured JSON data."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract structured data from the attached credit report. Return the data as JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const errorDetail = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorDetail}`);
    }

    const { choices } = await openaiResponse.json();
    const extractedContent = choices[0]?.message?.content;

    if (!extractedContent) {
      throw new Error('No content received from OpenAI.');
    }

    const structuredData = JSON.parse(extractedContent);

    return new Response(JSON.stringify({ structuredData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Extraction error:', error);

    return new Response(JSON.stringify({
      error: error.message || 'Unknown error during document extraction',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
