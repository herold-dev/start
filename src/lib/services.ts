import { supabase } from './supabase'

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface Service {
  id: string
  name: string
  description?: string
  base_price: number
  is_active: boolean
  created_at: string
}

export type ServiceInput = Omit<Service, 'id' | 'created_at'>

/* ─── CRUD ─────────────────────────────────────────────────────────────── */

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  return data || []
}

export async function createService(input: ServiceInput): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('Error creating service:', error)
    return null
  }
  return data
}

export async function updateService(id: string, updates: Partial<ServiceInput>): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating service:', error)
    return null
  }
  return data
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service:', error)
    return false
  }
  return true
}
