import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Get the authorization header to validate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    // Validate the user making the request
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5d29obWJxb2h5dHppd3NqcnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NjYzNDQsImV4cCI6MjA2MTQ0MjM0NH0.F1Y8K6wmkqTInHvI1j9Pbog782i3VSVpIbgYqakyPwo'));
    if (userError || !user) {
      throw new Error('Invalid token or user not found');
    }
    // Get the user ID to check from the request body (could be different from requesting user)
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('User ID not provided');
    }
    // Call the security definer function through a direct query
    const { data, error } = await supabase.rpc('check_admin_role', {
      user_id: userId
    });
    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({
      isAdmin: !!data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
