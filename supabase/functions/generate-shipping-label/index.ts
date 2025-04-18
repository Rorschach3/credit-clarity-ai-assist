
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { disputeId, toAddress } = await req.json()
    
    const shippoApiKey = Deno.env.get('SHIPPO_API_KEY')
    if (!shippoApiKey) {
      throw new Error('Shippo API key not configured')
    }

    // Create shipment using Shippo API
    const shipment = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${shippoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address_from: {
          name: "Your Company",
          street1: "215 Clayton St.",
          city: "San Francisco",
          state: "CA",
          zip: "94117",
          country: "US"
        },
        address_to: toAddress,
        parcels: [{
          length: "10",
          width: "8",
          height: "4",
          distance_unit: "in",
          weight: "2",
          mass_unit: "oz"
        }],
        async: false
      })
    })

    const shipmentData = await shipment.json()

    // Purchase the cheapest rate
    const rate = shipmentData.rates[0]
    const transaction = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${shippoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: rate.object_id,
        async: false
      })
    })

    const transactionData = await transaction.json()

    return new Response(
      JSON.stringify({
        labelUrl: transactionData.label_url,
        trackingNumber: transactionData.tracking_number
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
