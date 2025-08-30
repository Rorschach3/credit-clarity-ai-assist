import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.224.0/encoding/base32.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a cryptographically secure TOTP secret
function generateTotpSecret(): string {
  const buffer = new Uint8Array(20) // 160 bits for strong security
  crypto.getRandomValues(buffer)
  return encode(buffer).replace(/=/g, '') // Remove padding
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate secure TOTP secret
    const secret = generateTotpSecret()
    
    // Store the secret securely in user profile (encrypted in transit/at rest by Supabase)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        totp_secret: secret // This should be encrypted if storing long-term
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      console.error('Error storing TOTP secret:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to store TOTP secret' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generated TOTP secret for user ${user.id}`)
    
    // Return the secret and QR code URL
    const qrCodeValue = `otpauth://totp/Credit%20Clarity%20AI:${user.email}?secret=${secret}&issuer=Credit%20Clarity%20AI`
    
    return new Response(
      JSON.stringify({ 
        secret,
        qrCodeValue,
        backupCodes: [] // TODO: Generate backup codes
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})