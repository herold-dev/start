import { supabase } from './supabase';
import type { FinCategory, FinTransaction, FinTransactionWithCategory, FinRecurrence, FinRecurrenceWithCategory } from '../components/financeiro/types';

// ==========================================
// CATEGORIAS
// ==========================================

export async function fetchCategories(): Promise<FinCategory[]> {
  const { data, error } = await supabase
    .from('fin_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function createCategory(category: Omit<FinCategory, 'id' | 'created_at'>): Promise<FinCategory | null> {
  const { data, error } = await supabase
    .from('fin_categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }
  return data;
}

export async function updateCategory(id: string, updates: Partial<FinCategory>) {
  const { error } = await supabase
    .from('fin_categories')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('fin_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// ==========================================
// TRANSAÇÕES
// ==========================================

export async function fetchTransactions(startDate?: string, endDate?: string): Promise<FinTransactionWithCategory[]> {
  let query = supabase
    .from('fin_transactions')
    .select(`
      *,
      category:category_id (*)
    `)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return (data || []) as unknown as FinTransactionWithCategory[];
}

export async function createTransaction(transaction: Omit<FinTransaction, 'id' | 'created_at'>): Promise<FinTransaction | null> {
  const { data, error } = await supabase
    .from('fin_transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  return data;
}

export async function updateTransaction(id: string, updates: Partial<FinTransaction>) {
  const { error } = await supabase
    .from('fin_transactions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('fin_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

// ==========================================
// RECORRÊNCIAS
// ==========================================

export async function fetchRecurrences(): Promise<FinRecurrenceWithCategory[]> {
  const { data, error } = await supabase
    .from('fin_recurrences')
    .select(`
      *,
      category:category_id (*)
    `)
    .order('description', { ascending: true });

  if (error) {
    console.error('Error fetching recurrences:', error);
    return [];
  }
  return (data || []) as unknown as FinRecurrenceWithCategory[];
}

export async function createRecurrence(rec: Omit<FinRecurrence, 'id' | 'created_at'>): Promise<FinRecurrence | null> {
  const { data, error } = await supabase
    .from('fin_recurrences')
    .insert(rec)
    .select()
    .single();

  if (error) {
    console.error('Error creating recurrence:', error);
    return null;
  }
  return data;
}

export async function updateRecurrence(id: string, updates: Partial<FinRecurrence>): Promise<FinRecurrence | null> {
  const { data, error } = await supabase
    .from('fin_recurrences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating recurrence:', error);
    return null;
  }
  return data;
}

export async function deleteRecurrence(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('fin_recurrences')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting recurrence:', error);
    return false;
  }
  return true;
}

// ==========================================
// GERAÇÃO AUTOMÁTICA DE TRANSAÇÕES DO CLIENTE
// ==========================================

/**
 * Remove transações antigas geradas por esse cliente e gera novas
 * baseadas no tipo de pagamento (mensal, único, parcelado).
 */
export async function generateClientTransactions(opts: {
  clientId: string
  clientName: string
  serviceName: string
  paymentType: 'mensal' | 'unico' | 'parcelado'
  value: number
  dueDay: number
  installments?: number
  paymentStartDate?: string // ISO date — data de início para todos os tipos
  clientStatus?: 'Ativo' | 'Inativo' // Se inativo, apenas limpa e não gera novos
}): Promise<void> {
  const { clientId, clientName, serviceName, paymentType, value, dueDay, installments, paymentStartDate, clientStatus } = opts

  // 1. Remover transações pendentes anteriores geradas para este cliente
  const { error: delErr } = await supabase
    .from('fin_transactions')
    .delete()
    .eq('client_id', clientId)
    .eq('source', 'client')
    .eq('status', 'Pendente')

  if (delErr) console.error('Error cleaning client transactions:', delErr)

  // 2. Remover recorrência anterior
  const { error: delRecErr } = await supabase
    .from('fin_recurrences')
    .delete()
    .eq('client_id', clientId)
    .eq('source', 'client')

  if (delRecErr) console.error('Error cleaning client recurrence:', delRecErr)

  // 3. Se o cliente estiver Inativo ou sem valor, paramos por aqui (já limpou o futuro)
  if (clientStatus === 'Inativo' || !value || value <= 0) return

  const description = `${serviceName} — ${clientName}`

  // 4. Buscar datas das transações que restaram (Pagas, Atrasadas, etc)
  const { data: existingTxs } = await supabase
    .from('fin_transactions')
    .select('date')
    .eq('client_id', clientId)
    .eq('source', 'client')

  const existingDates = new Set((existingTxs || []).map(t => t.date))

  // Data de início: usa paymentStartDate se definida, senão hoje
  const startDate = paymentStartDate ? new Date(paymentStartDate + 'T12:00:00') : new Date()
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()

  /** Helper: calcula a data de vencimento para o mês N a partir do início */
  function dateForMonth(offsetMonths: number): string {
    const totalMonths = startMonth + offsetMonths
    const y = startYear + Math.floor(totalMonths / 12)
    const m = totalMonths % 12
    const maxDay = new Date(y, m + 1, 0).getDate()
    const day = Math.min(dueDay, maxDay)
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  if (paymentType === 'mensal') {
    // Criar recorrência no financeiro
    await createRecurrence({
      description,
      type: 'entrada',
      value,
      due_day: dueDay,
      is_active: true,
      client_id: clientId,
      source: 'client',
    })

    // Gerar 12 meses de transações futuras a partir da data de início
    const txs: Omit<FinTransaction, 'id' | 'created_at'>[] = []

    for (let i = 0; i < 12; i++) {
      const dt = dateForMonth(i)
      if (existingDates.has(dt)) continue // Pula meses que já têm transação (ex: Pagas)

      txs.push({
        type: 'entrada',
        date: dt,
        description,
        client_name: clientName,
        value,
        status: 'Pendente',
        is_recurrent: true,
        client_id: clientId,
        source: 'client',
      })
    }

    if (txs.length > 0) {
      const { error } = await supabase.from('fin_transactions').insert(txs)
      if (error) console.error('Error inserting monthly transactions:', error)
    }

  } else if (paymentType === 'parcelado' && installments && installments > 0) {
    const parcelValue = Math.round((value / installments) * 100) / 100
    const txs: Omit<FinTransaction, 'id' | 'created_at'>[] = []

    for (let i = 0; i < installments; i++) {
      const dt = dateForMonth(i)
      if (existingDates.has(dt)) continue

      txs.push({
        type: 'entrada',
        date: dt,
        description: `${description} (${i + 1}/${installments})`,
        client_name: clientName,
        value: parcelValue,
        status: 'Pendente',
        is_recurrent: false,
        client_id: clientId,
        source: 'client',
      })
    }

    if (txs.length > 0) {
      const { error } = await supabase.from('fin_transactions').insert(txs)
      if (error) console.error('Error inserting installment transactions:', error)
    }

  } else if (paymentType === 'unico') {
    const date = paymentStartDate || new Date().toISOString().slice(0, 10)

    if (!existingDates.has(date)) {
      await createTransaction({
        type: 'entrada',
        date,
        description,
        client_name: clientName,
        value,
        status: 'Pendente',
        is_recurrent: false,
        client_id: clientId,
        source: 'client',
      })
    }
  }
}
