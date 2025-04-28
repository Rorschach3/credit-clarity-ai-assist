
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

    // Create a new bucket for credit reports if it doesn't exist
    const { data: existingBuckets, error: bucketListError } = await supabase
      .storage
      .listBuckets();

    if (bucketListError) {
      throw bucketListError;
    }

    const creditReportsBucketExists = existingBuckets?.some(
      bucket => bucket.name === 'credit_reports'
    );

    if (!creditReportsBucketExists) {
      const { data, error } = await supabase
        .storage
        .createBucket('credit_reports', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
        });

      if (error) throw error;
    }

    // Create RLS policies for the bucket
    // Note: In a real implementation, we would use SQL to create proper RLS policies
    // This example assumes the bucket creation via the API also sets up default policies

    return new Response(
      JSON.stringify({ message: "Credit reports bucket configured successfully" }),
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
