
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create dispute documents bucket if it doesn't exist
    const { data: existingBuckets, error: bucketListError } = await supabase
      .storage
      .listBuckets();

    if (bucketListError) {
      throw bucketListError;
    }

    const disputeDocumentsBucketExists = existingBuckets?.some(
      bucket => bucket.name === 'dispute_documents'
    );

    if (!disputeDocumentsBucketExists) {
      const { data, error } = await supabase
        .storage
        .createBucket('dispute_documents', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        });

      if (error) throw error;
    }

    // Create RLS policies for the bucket
    // This is already done in the SQL migration

    return new Response(
      JSON.stringify({ message: "Dispute documents bucket configured successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error setting up storage bucket:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to configure storage bucket' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
