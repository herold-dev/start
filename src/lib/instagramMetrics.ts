import { supabase } from './supabase'
import type { InstagramMetric } from '../components/clientes/types'

export type MetricField = keyof Omit<InstagramMetric, 'id' | 'client_id' | 'period' | 'created_at' | 'updated_at'>

export const METRIC_FIELDS: { key: MetricField; label: string; emoji: string }[] = [
  { key: 'seguidores',         label: 'Seguidores',          emoji: '👥' },
  { key: 'novos_seguidores',   label: 'Novos Seguidores',    emoji: '➕' },
  { key: 'alcance',            label: 'Alcance',             emoji: '📡' },
  { key: 'impressoes',         label: 'Impressões',          emoji: '👁️' },
  { key: 'visualizacoes',      label: 'Visualizações',       emoji: '▶️' },
  { key: 'interacoes',         label: 'Interações',          emoji: '❤️' },
  { key: 'cliques_perfil',     label: 'Cliques no Perfil',   emoji: '🔗' },
  { key: 'salvamentos',        label: 'Salvamentos',         emoji: '🔖' },
  { key: 'compartilhamentos',  label: 'Compartilhamentos',   emoji: '↗️' },
]

export async function fetchMetrics(clientId: string): Promise<InstagramMetric[]> {
  const { data, error } = await supabase
    .from('instagram_metrics')
    .select('*')
    .eq('client_id', clientId)
    .order('period', { ascending: false })

  if (error) {
    console.error('Error fetching instagram metrics:', error)
    return []
  }
  return data || []
}

export async function upsertMetric(
  clientId: string,
  period: string,
  values: Partial<Omit<InstagramMetric, 'id' | 'client_id' | 'period' | 'created_at' | 'updated_at'>>
): Promise<InstagramMetric | null> {
  const { data, error } = await supabase
    .from('instagram_metrics')
    .upsert(
      { client_id: clientId, period, ...values, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,period' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting instagram metric:', error)
    return null
  }
  return data
}
