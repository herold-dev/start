import { supabase } from './supabase'

export interface Processo {
  id: string
  role: string
  title: string
  content: string | null
  updated_at: string
}

export async function fetchProcessos(): Promise<Processo[]> {
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('role', { ascending: true })

    if (error) {
      console.error('Error fetching processos:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching processos:', error)
    return []
  }
}

export async function updateProcesso(id: string, content: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('processos')
      .update({ content })
      .eq('id', id)

    if (error) {
      console.error('Error updating processo:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error updating processo:', error)
    return false
  }
}
