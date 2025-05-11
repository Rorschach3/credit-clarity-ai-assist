
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

    const creditReportsBucketExists = existingBuckets?.some(
      bucket => bucket.name === 'credit_reports'
    );

    // Create dispute_documents bucket if it doesn't exist
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

    // Create credit_reports bucket if it doesn't exist
    if (!creditReportsBucketExists) {
      const { data, error } = await supabase
        .storage
        .createBucket('credit_reports', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ message: "Storage buckets configured successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to configure storage buckets' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
