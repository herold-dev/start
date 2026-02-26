export type Id = string;

export interface CrmColumn {
  id: Id;
  title: string;
  order_index: number;
  color?: string;
}

export interface CrmLead {
  id: Id;
  column_id: Id;
  client_name: string;
  content: string;
  value: number;
  order_index: number;
  email?: string;
  phone?: string;
  source?: string;
  meeting_at?: string;
  notes?: string;
  responsible_name?: string;
}
