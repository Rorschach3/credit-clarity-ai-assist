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
    const upstageApiKey = Deno.env.get('UPSTAGE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!upstageApiKey || !supabaseUrl || !supabaseAnonKey) {
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

    const extraction_response = await fetch('https://api.upstage.ai/v1/information-extraction/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${upstageApiKey}`,
      },
      body: JSON.stringify({
        model: "information-extract",
        messages: [{
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${fileType};base64,${base64Data}`,
                    },
                },
            ],
        }],
        response_format: {
            "type": "json_schema",
            "json_schema": {
                "name": "document_schema",
                "schema": {
                    "type": "object",
                    "properties": {
                        "account_number": {
                            "type": "string",
                            "description": "tradeline account number"
                        },
                        "account_name": {
                            "type": "string",
                            "description": "Name of the Creditor or agency"
                        },
                        "balance": {
                            "type": "string",
                            "description": "amount owed"
                        },
                        "date_opened": {
                            "type": "string",
                            "description": "date the account was opened"
                        },
                        "monthly_payment": {
                            "type": "string",
                            "description": "monthly payment amount`"
                        },
                        "type": {
                            "type": "string",
                            "description": "what type of account"
                        },
                        "status": {
                            "type": "string",
                            "description": "The status of the tradeline"
                        }
                    }
                }
            }
        },
      })
    });

    if (!extraction_response.ok) {
      const errorDetail = await extraction_response.text();
      throw new Error(`Upstage API error: ${errorDetail}`);
    }

    const { choices } = await extraction_response.json();
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
