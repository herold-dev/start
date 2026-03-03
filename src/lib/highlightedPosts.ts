import { supabase } from './supabase'
import type { HighlightedPost } from '../components/clientes/types'

export async function fetchHighlightedPosts(
  clientId: string,
  period?: string
): Promise<HighlightedPost[]> {
  let query = supabase
    .from('highlighted_posts')
    .select(`
      id, client_id, content_id, period, highlight_reason, highlight_metrics, post_url, sort_order, created_at,
      client_contents!inner ( title, content_type, status, scheduled_date, midia_url )
    `)
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true })

  if (period) {
    query = query.eq('period', period)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching highlighted posts:', error)
    return []
  }

  // Flatten the joined data
  return (data || []).map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    content_id: row.content_id,
    period: row.period,
    highlight_reason: row.highlight_reason,
    highlight_metrics: row.highlight_metrics,
    sort_order: row.sort_order,
    created_at: row.created_at,
    post_url: row.post_url,
    content_title: row.client_contents?.title,
    content_type: row.client_contents?.content_type,
    content_thumbnail: row.client_contents?.midia_url,
    content_status: row.client_contents?.status,
    content_scheduled_date: row.client_contents?.scheduled_date,
  }))
}

export async function addHighlightedPost(
  clientId: string,
  contentId: string,
  period: string,
  highlightReason?: string,
  highlightMetrics?: string,
  postUrl?: string
): Promise<HighlightedPost | null> {
  const { data, error } = await supabase
    .from('highlighted_posts')
    .insert({
      client_id: clientId,
      content_id: contentId,
      period,
      highlight_reason: highlightReason || null,
      highlight_metrics: highlightMetrics || null,
      post_url: postUrl || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding highlighted post:', error)
    return null
  }
  return data
}

export async function updateHighlightedPost(
  id: string,
  highlightReason?: string,
  highlightMetrics?: string,
  postUrl?: string
): Promise<HighlightedPost | null> {
  const { data, error } = await supabase
    .from('highlighted_posts')
    .update({
      highlight_reason: highlightReason ?? null,
      highlight_metrics: highlightMetrics ?? null,
      post_url: postUrl ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating highlighted post:', error)
    return null
  }
  return data
}

export async function removeHighlightedPost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('highlighted_posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing highlighted post:', error)
    return false
  }
  return true
}
