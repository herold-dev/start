import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Chama a Edge Function manage-team
export async function callTeamFunction(action: 'create' | 'list' | 'delete' | 'update', payload?: any) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Não autenticado')
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Erro na requisição')
  }

  return json
}
