import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientId, month } = await req.json()

    if (!clientId || !month) {
      throw new Error('Missing clientId or month')
    }

    // Initialize Supabase with the SERVICE_ROLE_KEY to bypass RLS for this public route
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate start and end date of the requested month
    const [yearStr, monthStr] = month.split('-')
    const year = parseInt(yearStr)
    const monthNum = parseInt(monthStr) - 1 // JS months are 0-indexed
    
    // JS dates
    const startDate = new Date(year, monthNum, 1).toISOString().split('T')[0]
    const endDate = new Date(year, monthNum + 1, 0).toISOString().split('T')[0]

    // 1. Fetch Client info (public details + sharing config)
    const { data: client, error: clientErr } = await supabaseClient
      .from('clients')
      .select('id, name, social_handle, avatar_url, gradient_from, gradient_to, shared_calendar_active')
      .eq('id', clientId)
      .single()

    if (clientErr || !client) {
      throw clientErr || new Error('Client not found')
    }

    // Se o calendário não estiver ativo pro público, retornamos erro 403
    if (client.shared_calendar_active === false) {
      return new Response(JSON.stringify({ error: 'This calendar is currently private.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 2. Fetch all Client Contents for that month, FILTRADOS por status aprovado ou em aprovação
    const { data: contents, error: contentsErr } = await supabaseClient
      .from('client_contents')
      .select('id, title, description, content_type, status, channel, scheduled_date, tema_content, tema_status, conteudo_content, conteudo_status, midia_url, midia_status, legenda_content, legenda_status')
      .eq('client_id', clientId)
      .in('status', ['aprovado', 'em_aprovacao'])
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })

    if (contentsErr) {
      throw contentsErr
    }

    // 3. Fetch all Instagram Metrics for this client (all periods, for comparison)
    const { data: metrics } = await supabaseClient
      .from('instagram_metrics')
      .select('*')
      .eq('client_id', clientId)
      .order('period', { ascending: false })

    // 4. Fetch highlighted posts with joined content data
    const { data: highlightedPostsRaw } = await supabaseClient
      .from('highlighted_posts')
      .select(`
        id, client_id, content_id, period, highlight_reason, highlight_metrics, post_url, sort_order, created_at,
        client_contents!inner ( title, content_type, status, scheduled_date, midia_url )
      `)
      .eq('client_id', clientId)
      .order('sort_order', { ascending: true })

    const highlightedPosts = (highlightedPostsRaw || []).map((row: any) => ({
      id: row.id,
      client_id: row.client_id,
      content_id: row.content_id,
      period: row.period,
      highlight_reason: row.highlight_reason,
      highlight_metrics: row.highlight_metrics,
      post_url: row.post_url,
      sort_order: row.sort_order,
      created_at: row.created_at,
      content_title: row.client_contents?.title,
      content_type: row.client_contents?.content_type,
      content_thumbnail: row.client_contents?.midia_url,
      content_status: row.client_contents?.status,
      content_scheduled_date: row.client_contents?.scheduled_date,
    }))

    // Return combined public-ready data payload
    const payload = {
      client,
      contents: contents || [],
      metrics: metrics || [],
      highlightedPosts
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
