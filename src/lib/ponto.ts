import { supabase } from './supabase';

export interface RegistroPonto {
  id: string;
  user_id: string;
  user_name: string | null;
  data_registro: string;
  hora_entrada: string;
  hora_saida: string | null;
  descricao_atividades: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to get local date in YYYY-MM-DD
function getLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getRegistroHoje(): Promise<RegistroPonto | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const hoje = getLocalDate();

  const { data, error } = await supabase
    .from('registros_ponto')
    .select('*')
    .eq('user_id', user.id)
    .eq('data_registro', hoje)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as RegistroPonto | null;
}

export async function registrarEntrada(): Promise<RegistroPonto> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const hoje = getLocalDate();
  const d = new Date();
  const horaEntrada = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  let displayName = user.user_metadata?.name;
  if (!displayName && user.email) {
    const base = user.email.split('@')[0];
    displayName = base.charAt(0).toUpperCase() + base.slice(1);
  }

  const { data, error } = await supabase
    .from('registros_ponto')
    .insert([
      {
        user_id: user.id,
        user_name: displayName || 'Usuário',
        data_registro: hoje,
        hora_entrada: horaEntrada,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar entrada:', error);
    throw error;
  }

  return data as RegistroPonto;
}

export async function registrarSaida(id: string, descricao: string): Promise<RegistroPonto> {
  const d = new Date();
  const horaSaida = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  
  const { data, error } = await supabase
    .from('registros_ponto')
    .update({
      hora_saida: horaSaida,
      descricao_atividades: descricao,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar saída:', error);
    throw error;
  }

  return data as RegistroPonto;
}

export async function getHistoricoPonto(isAdmin = false): Promise<RegistroPonto[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  let query = supabase
    .from('registros_ponto')
    .select('*')
    .order('data_registro', { ascending: false })
    .order('hora_entrada', { ascending: false });

  // Se não for admin, filtra apenas os registros do próprio usuário
  if (!isAdmin) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as RegistroPonto[];
}
