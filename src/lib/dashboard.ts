import { supabase } from './supabase'

export interface UpcomingActivity {
  id: string
  title: string
  date: string
  clientName?: string
  assignee?: string
}

export interface ContentStats {
  emAprovacao: number
  emAjuste: number
  aprovado: number
  total: number
}

function deriveContentStatus(c: any): 'aprovacao' | 'ajuste' | 'aprovado' {
  const s = [c.tema_status, c.conteudo_status, c.midia_status, c.legenda_status]
  if (s.some(x => x === 'ajuste')) return 'ajuste'
  if (s.some(x => x === 'em_aprovacao')) return 'aprovacao'
  if (s.every(x => x === 'aprovado' || x === 'nao_se_aplica')) return 'aprovado'
  return 'aprovacao' // default to 'em aprovação' if pending
}

export async function fetchContentStats(): Promise<ContentStats> {
  try {
    const { data: contents } = await supabase
      .from('client_contents')
      .select('tema_status, conteudo_status, midia_status, legenda_status, clients!inner(status)')
      .eq('clients.status', 'Ativo')

    const stats = { emAprovacao: 0, emAjuste: 0, aprovado: 0, total: 0 }
    
    if (contents) {
       for (const c of contents) {
         const s = deriveContentStatus(c)
         if (s === 'ajuste') stats.emAjuste++
         else if (s === 'aprovacao') stats.emAprovacao++
         else if (s === 'aprovado') stats.aprovado++
         stats.total++
       }
    }
    return stats
  } catch (err) {
    console.error('Error fetching content stats', err)
    return { emAprovacao: 0, emAjuste: 0, aprovado: 0, total: 0 }
  }
}

export async function fetchUpcomingManualTasks(): Promise<UpcomingActivity[]> {
  const todayISO = new Date(new Date().setHours(0,0,0,0)).toISOString()
  try {
    const { data } = await supabase
      .from('activities')
      .select(`id, title, due_date, assignee:usuarios!activities_assigned_to_fkey(nome)`)
      .eq('status', 'pendente')
      .gte('due_date', todayISO)
      .order('due_date', { ascending: true })
      .limit(5)

    return (data || []).map(m => ({
      id: m.id,
      title: m.title,
      date: m.due_date || new Date().toISOString(),
      assignee: (m as any).assignee?.nome
    }))
  } catch (err) {
    return []
  }
}

export async function fetchUpcomingMeetings(): Promise<UpcomingActivity[]> {
  const todayISO = new Date(new Date().setHours(0,0,0,0)).toISOString()
  try {
    const { data } = await supabase
      .from('reunioes')
      .select(`id, title, meeting_date, clients(name)`)
      .eq('status', 'agendada')
      .gte('meeting_date', todayISO)
      .order('meeting_date', { ascending: true })
      .limit(5)

    return (data || []).map(m => ({
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      clientName: (m as any).clients?.name || ''
    }))
  } catch (err) {
    return []
  }
}

export async function fetchUpcomingCaptures(): Promise<UpcomingActivity[]> {
  const todayISO = new Date(new Date().setHours(0,0,0,0)).toISOString()
  try {
    const { data } = await supabase
      .from('captacoes')
      .select(`id, title, capture_date, clients(name)`)
      .eq('status', 'agendada')
      .gte('capture_date', todayISO)
      .order('capture_date', { ascending: true })
      .limit(5)

    return (data || []).map(c => ({
      id: c.id,
      title: c.title,
      date: c.capture_date,
      clientName: (c as any).clients?.name || ''
    }))
  } catch (err) {
    return []
  }
}
