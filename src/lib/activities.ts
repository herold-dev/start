import { supabase } from './supabase'

export interface ManualActivity {
  id: string
  title: string
  description?: string
  assigned_to?: string
  due_date?: string
  status: 'pendente' | 'concluida'
  created_by: string
  created_at: string
  assignee?: {
    nome: string
    avatar_url?: string
    gradient_from?: string
    gradient_to?: string
  }
}

export interface ManualActivityInput {
  title: string
  description?: string
  assigned_to?: string
  due_date?: string
  status?: 'pendente' | 'concluida'
}

export async function fetchUsersForAssignment() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome')
    .order('nome')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  return data || []
}

export async function fetchManualActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      assignee:usuarios!activities_assigned_to_fkey(nome)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }
  return data || []
}

export async function createManualActivity(input: ManualActivityInput): Promise<ManualActivity | null> {
  const { data, error } = await supabase
    .from('activities')
    .insert([{
      ...input,
      assigned_to: input.assigned_to || null,
      due_date: input.due_date || null
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating activity:', error)
    return null
  }
  return data
}

export async function updateManualActivity(id: string, input: Partial<ManualActivityInput>): Promise<ManualActivity | null> {
  const { data, error } = await supabase
    .from('activities')
    .update({
      ...input,
      assigned_to: input.assigned_to || null,
      due_date: input.due_date || null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating activity:', error)
    return null
  }
  return data
}

export async function deleteManualActivity(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting activity:', error)
    return false
  }
  return true
}
