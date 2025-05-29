import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { error } = await supabase.from('user_roles').select('*').limit(1);

    if (error) {
      // Table doesn't exist, create it
      const { error: createTableError } = await supabase.schema.createTable('user_roles', (table) => {
        table.uuid('user_id').primaryKey();
        table.string('role').notNullable();
        table.foreignKey('user_id').references('users', 'id').onDelete('CASCADE');
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user_roles table' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      } else {
        console.log('user_roles table created successfully');
        return new Response(
          JSON.stringify({ message: 'user_roles table created successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('user_roles table already exists');
      return new Response(
        JSON.stringify({ message: 'user_roles table already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});