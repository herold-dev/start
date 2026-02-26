import { supabase } from './supabase'

export interface Capture {
  id: string
  client_id?: string
  title: string
  capture_date: string
  start_time?: string
  end_time?: string
  location?: string
  type: 'foto' | 'video' | 'foto_video'
  status: 'agendada' | 'realizada' | 'cancelada' | 'nao_agendada'
  notes?: string
  created_at: string
  client_contents?: { id: string; title: string; content_type: string; conteudo_content?: string; precisa_captacao?: boolean }[]
}

export interface CaptureInput {
  client_id?: string
  title: string
  capture_date: string
  start_time?: string
  end_time?: string
  location?: string
  type: 'foto' | 'video' | 'foto_video'
  status: 'agendada' | 'realizada' | 'cancelada' | 'nao_agendada'
  notes?: string
}

export async function fetchCaptures(): Promise<Capture[]> {
  const { data, error } = await supabase
    .from('captures')
    .select('*, client_contents(id, title, content_type, conteudo_content, precisa_captacao)')
    .order('capture_date', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createCapture(input: CaptureInput): Promise<Capture | null> {
  const { data, error } = await supabase
    .from('captures')
    .insert(input)
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateCapture(id: string, input: Partial<CaptureInput>): Promise<Capture | null> {
  const { data, error } = await supabase
    .from('captures')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function deleteCapture(id: string): Promise<boolean> {
  const { error } = await supabase.from('captures').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}
