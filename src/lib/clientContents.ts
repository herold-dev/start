import { supabase } from './supabase'
import type { ClientContent, ClientContentInput, ClientNote, NoteTab, ContentStatus } from '../components/clientes/types'

function getCaptureTitleName(dateStr?: string) {
  let d = new Date()
  if (dateStr) {
    const [y, m, day] = dateStr.split('-').map(Number)
    if (y && m) d = new Date(y, m - 1, day || 1)
  }
  const month = d.toLocaleDateString('pt-BR', { month: 'long' })
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1)
  return `Captação - ${monthCap} ${d.getFullYear()}`
}

/* ─── Derivar status geral a partir das abas ─────────────────────────── */
/**
 * Calcula o status "geral" de um conteúdo a partir dos status individuais de
 * cada aba (tema, conteúdo, mídia e legenda).
 *
 * Hierarquia (pior primeiro):
 *   ajuste > em_aprovacao > rascunho > aprovado
 *
 * Ou seja:
 * - Se TODAS as abas forem "aprovado" → aprovado
 * - Se alguma for "ajuste"            → ajuste
 * - Se alguma for "em_aprovacao"      → em_aprovacao
 * - Caso contrário                    → rascunho
 */
export function deriveStatus(c: Pick<ClientContent, 'tema_status' | 'conteudo_status' | 'midia_status' | 'legenda_status'>): ContentStatus {
  const statuses: ContentStatus[] = [
    c.tema_status     || 'rascunho',
    c.conteudo_status || 'rascunho',
    c.midia_status    || 'rascunho',
    c.legenda_status  || 'rascunho',
  ]

  // Se pelo menos um sub-status for 'postado' → post está postado
  if (statuses.includes('postado'))      return 'postado'
  if (statuses.includes('ajuste'))       return 'ajuste'
  if (statuses.includes('em_aprovacao')) return 'em_aprovacao'
  if (statuses.every(s => s === 'aprovado')) return 'aprovado'
  return 'rascunho'
}

/* ─── Content Stats ────────────────────────────────────────────────────── */

export interface ContentStats {
  total: number
  aprovados: number
  postados: number
  faltam: number
}

export async function fetchContentStats(clientId: string): Promise<ContentStats> {
  const { data, error } = await supabase
    .from('client_contents')
    .select('status')
    .eq('client_id', clientId)

  if (error || !data) return { total: 0, aprovados: 0, postados: 0, faltam: 0 }

  const total = data.length
  const aprovados = data.filter(r => r.status === 'aprovado').length
  const postados = data.filter(r => r.status === 'postado').length
  return { total, aprovados, postados, faltam: aprovados }
}

export async function fetchAllClientsContentStats(): Promise<Record<string, ContentStats>> {
  const { data, error } = await supabase
    .from('client_contents')
    .select('client_id, status')

  if (error || !data) return {}

  const map: Record<string, ContentStats> = {}

  for (const row of data) {
    const cid = row.client_id
    if (!map[cid]) map[cid] = { total: 0, aprovados: 0, postados: 0, faltam: 0 }
    map[cid].total++
    if (row.status === 'aprovado') map[cid].aprovados++
    if (row.status === 'postado')  map[cid].postados++
  }

  // faltam = aprovados (ainda não foram marcados como postados)
  for (const cid of Object.keys(map)) {
    map[cid].faltam = map[cid].aprovados
  }

  return map
}

/* ─── Contents CRUD ───────────────────────────────────────────────────── */

export async function fetchContents(
  clientId: string,
  startDate?: string,
  endDate?: string
): Promise<ClientContent[]> {
  let query = supabase
    .from('client_contents')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_date', { ascending: true })

  if (startDate) query = query.gte('scheduled_date', startDate)
  if (endDate) query = query.lte('scheduled_date', endDate)

  const { data, error } = await query
  if (error) {
    console.error('Error fetching contents:', error)
    return []
  }
  return data || []
}

export async function createContent(input: ClientContentInput): Promise<ClientContent | null> {
  const finalInput = { ...input }

  if (finalInput.precisa_captacao) {
    const targetTitle = getCaptureTitleName(finalInput.scheduled_date)
    const { data: existingCapture } = await supabase
      .from('captures')
      .select('id')
      .eq('client_id', finalInput.client_id)
      .eq('status', 'nao_agendada')
      .eq('title', targetTitle)
      .limit(1)
      .maybeSingle()

    if (existingCapture) {
      finalInput.capture_id = existingCapture.id
    } else {
      const { data: newCapture } = await supabase
        .from('captures')
        .insert({
          client_id: finalInput.client_id,
          title: targetTitle,
          capture_date: finalInput.scheduled_date || new Date().toISOString().split('T')[0],
          status: 'nao_agendada',
          type: 'foto_video'
        })
        .select('id')
        .single()
      if (newCapture) finalInput.capture_id = newCapture.id
    }
  }

  const { data, error } = await supabase
    .from('client_contents')
    .insert(finalInput)
    .select()
    .single()

  if (error) {
    console.error('Error creating content:', error)
    return null
  }
  return data
}

export async function updateContent(
  id: string,
  input: Partial<ClientContentInput>
): Promise<ClientContent | null> {
  const finalInput = { ...input }

  // fetch current state to know client_id, capture_id, and scheduled_date if needed
  const { data: curr } = await supabase.from('client_contents').select('client_id, capture_id, scheduled_date').eq('id', id).single()
  
  if (finalInput.precisa_captacao === true) {
    const clientId = finalInput.client_id || curr?.client_id
    const prevCaptureId = finalInput.capture_id || curr?.capture_id
    const scheduledDate = finalInput.scheduled_date !== undefined ? finalInput.scheduled_date : curr?.scheduled_date

    // Only assign a capture if it doesn't already have one
    if (!prevCaptureId && clientId) {
      const targetTitle = getCaptureTitleName(scheduledDate)
      const { data: existingCapture } = await supabase
        .from('captures')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'nao_agendada')
        .eq('title', targetTitle)
        .limit(1)
        .maybeSingle()

      if (existingCapture) {
        finalInput.capture_id = existingCapture.id
      } else {
        const { data: newCapture } = await supabase
          .from('captures')
          .insert({
            client_id: clientId,
            title: targetTitle,
            capture_date: scheduledDate || new Date().toISOString().split('T')[0],
            status: 'nao_agendada',
            type: 'foto_video'
          })
          .select('id')
          .single()
        if (newCapture) finalInput.capture_id = newCapture.id
      }
    } else if (prevCaptureId) {
       // Kept existing capture
       finalInput.capture_id = prevCaptureId
    }
  } else if (finalInput.precisa_captacao === false) {
    finalInput.capture_id = null
  }

  const { data, error } = await supabase
    .from('client_contents')
    .update(finalInput)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating content:', error)
    return null
  }
  return data
}

export async function deleteContent(id: string): Promise<boolean> {
  const { error } = await supabase.from('client_contents').delete().eq('id', id)
  if (error) {
    console.error('Error deleting content:', error)
    return false
  }
  return true
}

/* ─── Notes CRUD ──────────────────────────────────────────────────────── */

export async function fetchNotes(clientId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)

  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }
  return data || []
}

export async function upsertNote(
  clientId: string,
  tab: NoteTab,
  content: string
): Promise<ClientNote | null> {
  const { data, error } = await supabase
    .from('client_notes')
    .upsert(
      { client_id: clientId, tab, content, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,tab' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting note:', error)
    return null
  }
  return data
}
