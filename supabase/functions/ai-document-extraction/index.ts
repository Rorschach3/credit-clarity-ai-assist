
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const { fileUrl, fileType } = await req.json();
    if (!fileUrl) {
      throw new Error('Missing file URL');
    }

    console.log(`Processing ${fileType} document from URL: ${fileUrl}`);
    
    // Create a supabase client for accessing the file
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // If this is a stored file in Supabase storage, get a download URL
    let fileData;
    if (fileUrl.includes('storage/v1')) {
      const path = fileUrl.split('/').slice(-2).join('/');
      const bucket = fileUrl.split('/').slice(-3, -2)[0];
      
      const { data: downloadData, error: downloadError } = await supabase
        .storage
        .from(bucket)
        .download(path);
        
      if (downloadError) {
        throw new Error(`Error downloading file: ${downloadError.message}`);
      }
      
      fileData = await downloadData.arrayBuffer();
    } else {
      // For external URLs, download the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Error downloading file: ${response.statusText}`);
      }
      fileData = await response.arrayBuffer();
    }
    
    // For PDF files, use text extraction via OpenAI
    // NOTE: In a production implementation, you would use a specialized OCR service
    // This is a simplified implementation for demonstration
    
    // Convert file data to base64 for API request
    const base64Data = btoa(
      new Uint8Array(fileData).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Use OpenAI Vision API to extract text from document
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured information from credit reports. Extract all account information, focusing on negative items. Include creditor names, account numbers, balances, payment status, and dates reported."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the full text and structured data from this credit report. Identify all accounts, especially negative items, and organize them by creditor."
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
        max_tokens: 4000
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    const extractedContent = openaiData.choices[0].message.content;

    // Process the raw extraction to create structured data
    // In a real implementation, this would use a more sophisticated approach
    // For this example, we'll simulate an AI parsing the text into structured data
    const parsedResponse = await simulateStructuredDataExtraction(extractedContent);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI document extraction:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error in document extraction' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to simulate structured data extraction
// In a real implementation, this would be a more sophisticated parser
async function simulateStructuredDataExtraction(rawText: string) {
  // Use OpenAI to structure the extracted text
  // This is a simplified example - a real implementation would be more robust
  
  // For demo purposes, creating mock structured data
  // This simulates what would come from an AI-powered extraction
  const mockAccounts = extractAccountsFromText(rawText);
  
  return {
    rawText,
    structuredData: {
      accounts: mockAccounts
    }
  };
}

// Helper to extract accounts from text
function extractAccountsFromText(text: string) {
  // Extract creditor patterns from text
  // This is a very simplified implementation for demo purposes
  const mockAccounts = [];
  const creditorPatterns = [
    /([A-Z\s]+)\s+ACCOUNT\s+#\s*([A-Z0-9-]+)/gi,
    /([A-Z\s]+)\s+BAL[A-Z]*\s+\$?([\d,]+)/gi,
    /([A-Z\s]+)\s+REPORTED\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi
  ];
  
  let accountId = 1;
  const extractedCreditors = new Set();
  
  // Extract accounts using patterns
  for (const pattern of creditorPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    
    while ((match = pattern.exec(text)) !== null) {
      const creditorName = match[1].trim();
      if (!extractedCreditors.has(creditorName) && creditorName.length > 3) {
        extractedCreditors.add(creditorName);
        
        // Create a mock account with extracted and generated data
        mockAccounts.push({
          id: accountId.toString(),
          creditorName,
          accountNumber: `XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: `$${Math.floor(100 + Math.random() * 5000)}`,
          dateReported: `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`,
          bureaus: ['Experian', 'TransUnion', 'Equifax'].slice(0, Math.floor(1 + Math.random() * 3)),
          reason: ['Late Payment', 'Collection', 'Charge-off', 'Derogatory Mark'][Math.floor(Math.random() * 4)],
          status: Math.random() > 0.3 ? 'Open' : 'Closed',
          score: Math.floor(30 + Math.random() * 70)
        });
        
        accountId++;
      }
    }
  }
  
  return mockAccounts;
}
