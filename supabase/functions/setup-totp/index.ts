import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticator } from 'otplib';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authorization header to validate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Validate the user making the request
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid token or user not found');
    }

    // Only admins can setup TOTP for other users
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!isAdmin) {
      throw new Error('Unauthorized: Only admins can setup TOTP');
    }

    // Get the user ID from the request body
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('User ID not provided');
    }

    // Generate TOTP secret
    const totpSecret = authenticator.generateSecret();

    // Update user's app_metadata with the TOTP secret
    const { data, error } = await supabase
      .from('profiles') // Assuming you have a 'profiles' table
      .update({ app_metadata: { ...user.app_metadata, totp_secret: totpSecret } })
      .eq('id', userId);

    if (error) {
      throw new Error('Failed to update user\'s app_metadata: ' + error.message);
    }

    return new Response(
      JSON.stringify({ totpSecret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticator } from 'otplib';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authorization header to validate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

    // Validate the user making the request
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Invalid token or user not found');
      throw new Error('Invalid token or user not found');
    }

    // Only admins can setup TOTP for other users
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!isAdmin) {
      console.error('Unauthorized: Only admins can setup TOTP');
      throw new Error('Unauthorized: Only admins can setup TOTP');
    }

    // Get the user ID from the request body
    const { userId } = await req.json();
    if (!userId) {
      console.error('User ID not provided');
      throw new Error('User ID not provided');
    }

    // Generate TOTP secret
    const totpSecret = authenticator.generateSecret();

    // Update user's app_metadata with the TOTP secret
    const { data, error } = await supabase
      .from('profiles') // Assuming you have a 'profiles' table
      .update({ app_metadata: { ...user.app_metadata, totp_secret: totpSecret } })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user\'s app_metadata:', error.message);
      throw new Error('Failed to update user\'s app_metadata: ' + error.message);
    }

    return new Response(
      JSON.stringify({ totpSecret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in setup-totp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});