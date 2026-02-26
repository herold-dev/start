import { supabase } from './supabase';
import type { CrmColumn, CrmLead } from '../components/crm/types';

export async function fetchColumns(): Promise<CrmColumn[]> {
  const { data, error } = await supabase
    .from('crm_columns')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching CRM columns:', error);
    return [];
  }
  return data || [];
}

export async function createColumn(column: Omit<CrmColumn, 'id' | 'created_at'>): Promise<CrmColumn | null> {
  const { data, error } = await supabase
    .from('crm_columns')
    .insert(column)
    .select()
    .single();

  if (error) {
    console.error('Error creating CRM column:', error);
    return null;
  }
  return data;
}

export async function updateColumn(columnId: string, updates: Partial<CrmColumn>) {
  const { error } = await supabase
    .from('crm_columns')
    .update(updates)
    .eq('id', columnId);

  if (error) {
    console.error('Error updating CRM column:', error);
    throw error;
  }
}

export async function deleteColumn(columnId: string): Promise<void> {
  const { error } = await supabase
    .from('crm_columns')
    .delete()
    .eq('id', columnId);

  if (error) {
    console.error('Error deleting CRM column:', error);
    throw error;
  }
}

export async function fetchLeads(startDate?: string, endDate?: string): Promise<CrmLead[]> {
  let query = supabase
    .from('crm_leads')
    .select('*')
    .order('order_index', { ascending: true });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching CRM leads:', error);
    return [];
  }
  return data || [];
}

export async function updateLead(leadId: string, updates: Partial<CrmLead>) {
  const { error } = await supabase
    .from('crm_leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    console.error('Error updating CRM lead:', error);
    throw error;
  }
}

export async function updateLeadOrders(leads: { id: string; order_index: number }[]) {
  // Simple iteration for order updates. In production for large sets, an RPC is better.
  for (const lead of leads) {
    await updateLead(lead.id, { order_index: lead.order_index });
  }
}

export async function createLead(lead: Omit<CrmLead, 'id' | 'created_at'>): Promise<CrmLead | null> {
  const { data, error } = await supabase
    .from('crm_leads')
    .insert(lead)
    .select()
    .single();

  if (error) {
    console.error('Error creating CRM lead:', error);
    return null;
  }
  return data;
}

export async function deleteLead(leadId: string): Promise<void> {
  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Error deleting CRM lead:', error);
    throw error;
  }
}
