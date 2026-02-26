import { supabase } from './supabase'
import type { Client, ClientInput } from '../components/clientes/types'

/* ─── Clients ─────────────────────────────────────────────────────────────── */

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  return data || []
}

export async function createClient(input: ClientInput): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    return null
  }
  return data
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    return null
  }
  return data
}

export async function deleteClient(id: string): Promise<boolean> {
  // 1. Limpa registros financeiros pendentes vinculados a este cliente para não sujar futuro
  await supabase.from('fin_transactions').delete().eq('client_id', id).eq('source', 'client').eq('status', 'Pendente')
  await supabase.from('fin_recurrences').delete().eq('client_id', id).eq('source', 'client')

  // 2. Apaga o cliente em si
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) {
    console.error('Error deleting client:', error)
    return false
  }
  return true
}

/* ─── Avatar Upload ─────────────────────────────────────────────────────── */

export async function uploadAvatar(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('client-avatars')
    .upload(fileName, file, { upsert: true })

  if (error) {
    console.error('Error uploading avatar:', error)
    return null
  }

  const { data } = supabase.storage
    .from('client-avatars')
    .getPublicUrl(fileName)

  return data.publicUrl
}
