// supabase/functions/docai-ocr/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Document AI processing
async function processDocument(
  fileBytes: Uint8Array,
  mimeType: string,
  projectId: string,
  location: string,
  processorId: string,
  serviceAccount: any
): Promise<string> {
  console.log('Starting Document AI processing...');
  
  // Convert Uint8Array to base64
  const base64Document = btoa(String.fromCharCode(...fileBytes));
  
  // Get access token
  const accessToken = await getAccessToken(serviceAccount);
  
  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
  
  const requestBody = {
    rawDocument: {
      content: base64Document,
      mimeType: mimeType
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Document AI API error:', response.status, errorText);
      throw new Error(`Document AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Document AI response received, extracting text...');

    // Extract text from Document AI response
    let extractedText = '';
    if (result.document && result.document.text) {
      extractedText = result.document.text;
    }

    console.log(`Extracted ${extractedText.length} characters of text`);
    return extractedText;
  } catch (error) {
    console.error('Error calling Document AI:', error);
    throw error;
  }
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token expires in 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: now
  };

  // Create JWT
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

const PROJECT_ID = Deno.env.get("GOOGLE_PROJECT_ID");
const LOCATION = "us"; // Default location
const PROCESSOR_ID = Deno.env.get("PROCESSOR_ID");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Processing document with Google Document AI...');
    
    const { file, mimeType } = await req.json();

    if (!file || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing file or mimeType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!mimeType.includes('pdf') && !mimeType.includes('image')) {
      return new Response(JSON.stringify({ error: 'Unsupported file type. Only PDF and image files are supported.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build service account object from environment variables
    const serviceAccount = {
      type: Deno.env.get("type"),
      project_id: Deno.env.get("project_id"),
      private_key_id: Deno.env.get("private_key_id"),
      private_key: Deno.env.get("private_key")?.replace(/\\n/g, '\n'),
      client_email: Deno.env.get("client_email"),
      client_id: Deno.env.get("client_id"),
      auth_uri: Deno.env.get("auth_uri"),
      token_uri: Deno.env.get("token_uri"),
      auth_provider_x509_cert_url: Deno.env.get("auth_provider_x509_cert_url"),
      client_x509_cert_url: Deno.env.get("client_x509_cert_url"),
      universe_domain: Deno.env.get("universe_domain")
    };

    if (!PROJECT_ID || !serviceAccount.private_key) {
      return new Response(JSON.stringify({ error: 'Missing required Google Cloud credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const documentBytes = new Uint8Array(file);
    
    console.log(`Processing ${mimeType} file of size ${documentBytes.length} bytes`);
    
    const extractedText = await processDocument(
      documentBytes, 
      mimeType, 
      PROJECT_ID, 
      LOCATION, 
      PROCESSOR_ID || 'default-processor', 
      serviceAccount
    );

    console.log('Text extraction completed successfully');

    return new Response(JSON.stringify({ 
      text: extractedText,
      success: true,
      processedWith: 'Google Document AI'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});