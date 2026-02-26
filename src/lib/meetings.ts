import { supabase } from './supabase'

export interface Meeting {
  id: string
  title: string
  description?: string
  responsible_name?: string
  lead_id?: string
  service_id?: string
  client_id?: string
  meeting_date: string
  duration_minutes: number
  location?: string
  meeting_url?: string
  status: 'nao_agendada' | 'agendada' | 'realizada' | 'cancelada'
  notes?: string
  created_at: string
}

export interface MeetingInput {
  title: string
  description?: string
  responsible_name?: string
  lead_id?: string
  service_id?: string
  client_id?: string
  meeting_date: string
  duration_minutes?: number
  location?: string
  meeting_url?: string
  status?: 'nao_agendada' | 'agendada' | 'realizada' | 'cancelada'
  notes?: string
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createMeeting(input: MeetingInput): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .insert(input)
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateMeeting(id: string, input: Partial<MeetingInput>): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const { error } = await supabase.from('meetings').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}
