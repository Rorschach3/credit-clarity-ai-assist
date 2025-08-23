import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Textract integration
class TextractService {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor() {
    this.accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID') || '';
    this.secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY') || '';
    this.region = Deno.env.get('AWS_REGION') || 'us-east-1';
  }

  async signRequest(method: string, url: string, body: string): Promise<HeadersInit> {
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(body);
    
    // Create AWS Signature Version 4
    const date = new Date();
    const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    
    const host = `textract.${this.region}.amazonaws.com`;
    const service = 'textract';
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    
    // Create canonical request
    const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\nx-amz-target:Textract.DetectDocumentText\n`;
    const signedHeaders = 'host;x-amz-date;x-amz-target';
    
    // Hash the body
    const bodyHash = await this.sha256(bodyBytes);
    
    const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;
    
    // Create string to sign
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await this.sha256(encoder.encode(canonicalRequest))}`;
    
    // Calculate signature
    const signingKey = await this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, service);
    const signature = await this.hmacSha256(signingKey, stringToSign);
    
    const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      'Authorization': authorizationHeader,
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Date': amzDate,
      'X-Amz-Target': 'Textract.DetectDocumentText',
      'Host': host,
    };
  }

  async sha256(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async hmacSha256(key: Uint8Array, data: string): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
    const kDate = await this.hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp);
    const kRegion = await this.hmacSha256Raw(kDate, regionName);
    const kService = await this.hmacSha256Raw(kRegion, serviceName);
    const kSigning = await this.hmacSha256Raw(kService, 'aws4_request');
    return kSigning;
  }

  async hmacSha256Raw(key: Uint8Array, data: string): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(signature);
  }

  async extractTextFromDocument(documentBytes: Uint8Array): Promise<string> {
    console.log('Starting Textract processing...');
    
    // Convert Uint8Array to base64
    const base64Document = btoa(String.fromCharCode(...documentBytes));
    
    const requestBody = JSON.stringify({
      Document: {
        Bytes: base64Document
      }
    });

    const url = `https://textract.${this.region}.amazonaws.com/`;
    const headers = await this.signRequest('POST', url, requestBody);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Textract API error:', response.status, errorText);
        throw new Error(`AWS Textract API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Textract response received, extracting text...');

      // Extract text from Textract response
      let extractedText = '';
      if (result.Blocks) {
        result.Blocks.forEach((block: any) => {
          if (block.BlockType === 'LINE' && block.Text) {
            extractedText += block.Text + '\n';
          }
        });
      }

      console.log(`Extracted ${extractedText.length} characters of text`);
      return extractedText;
    } catch (error) {
      console.error('Error calling Textract:', error);
      throw error;
    }
  }
}

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
    console.log('Processing document with AWS Textract...');
    
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

    const textractService = new TextractService();
    const documentBytes = new Uint8Array(file);
    
    console.log(`Processing ${mimeType} file of size ${documentBytes.length} bytes`);
    
    const extractedText = await textractService.extractTextFromDocument(documentBytes);

    console.log('Text extraction completed successfully');

    return new Response(JSON.stringify({ 
      text: extractedText,
      success: true,
      processedWith: 'AWS Textract'
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