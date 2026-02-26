// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const DenoEnv = Deno.env

    const supabaseAdmin = createClient(
      DenoEnv.get('SUPABASE_URL') ?? '',
      DenoEnv.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + authError?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify admin role
    const { data: profile } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admins only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, id, password, name } = await req.json()

    if (action === 'update') {
      if (!id) {
         return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Update password via Auth Admin
      if (password) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
        if (updateAuthError) {
          return new Response(JSON.stringify({ error: updateAuthError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // Update name in Database
      if (name) {
        const { error: updateDbError } = await supabaseAdmin
          .from('usuarios')
          .update({ nome: name })
          .eq('id', id)
        
        if (updateDbError) {
           return new Response(JSON.stringify({ error: updateDbError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
