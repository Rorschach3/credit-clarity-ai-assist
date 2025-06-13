import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

interface WebhookRequest {
 file: string; // Base64 encoded file
}

Deno.serve(async (req: Request) => {
  console.log("Incoming request method:", req.method); // Log the incoming request method

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { file } = await req.json() as WebhookRequest;

    if (!file) {
      console.warn("No file uploaded in request");
      return new Response(JSON.stringify({ message: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Base64 format
    if (!file.startsWith('data:application/pdf;base64,')) {
      console.warn("Invalid Base64 format");
      return new Response(JSON.stringify({ message: 'Invalid file format. Expected Base64 encoded PDF.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileBuffer = Uint8Array.from(atob(file.split(',')[1]), c => c.charCodeAt(0));
    const fileSizeInBytes = fileBuffer.byteLength;
    console.log("File size after Base64 decoding:", fileSizeInBytes); // Added logging

    const filename = `credit-report-${uuidv4()}.pdf`;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ message: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Supabase Auth Error:', userError);
      return new Response(JSON.stringify({ message: 'Unauthorized: Invalid token or user not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    const maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB

    if (fileSizeInBytes > maxFileSizeInBytes) {
      return new Response(JSON.stringify({ message: 'File size exceeds 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upload file to Supabase Storage
    const { data, error: uploadError } = await supabaseClient.storage
      .from('credit-reports')
      .upload(`${userId}/${filename}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false, // Do not upsert, create new file
      });

    if (uploadError) {
      console.error('Supabase Storage Error:', uploadError);
      return new Response(JSON.stringify({ message: 'Failed to upload file to storage' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const storagePath = data.path;

    // Save file metadata to Supabase database
    // 1. Insert into encrypted_report_content
    const { data: encryptionResult, error: contentError } = await supabaseClient
      .from('encrypted_report_content')
      .insert([
        {
          encrypted_data: fileBuffer, // Storing raw buffer, ensure this is handled securely
        },
      ])
      .select('content_id')
      .single();

    if (contentError) {
      console.error('Supabase Database Error (encrypted_report_content):', contentError);
      return new Response(JSON.stringify({ message: 'Failed to save encrypted file content to database' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Insert into credit_reports
    const { error: reportError } = await supabaseClient
      .from('credit_reports')
      .insert([
        {
          user_id: userId,
          content_id: encryptionResult?.content_id,
          storage_path: storagePath,
        },
      ]);

    if (reportError) {
      console.error('Supabase Database Error (credit_reports):', reportError);
      return new Response(JSON.stringify({ message: 'Failed to save file metadata to database' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'File uploaded successfully', storagePath }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Failed to upload file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});