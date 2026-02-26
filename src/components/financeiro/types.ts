export type FinType = 'entrada' | 'saida';

export interface FinCategory {
  id: string;
  name: string;
  type: FinType;
  color: string;
  created_at?: string;
}

export interface FinTransaction {
  id: string;
  type: FinType;
  date: string;
  description: string;
  client_name?: string;
  category_id?: string;
  value: number;
  status: string;
  pgto_method?: string;
  is_recurrent: boolean;
  client_id?: string;
  source?: string; // 'manual' | 'client'
  created_at?: string;
}

// Join type para visualização
export interface FinTransactionWithCategory extends FinTransaction {
  category?: FinCategory;
}

// Recorrências (assinaturas, gastos fixos)
export interface FinRecurrence {
  id: string;
  description: string;
  type: FinType;
  value: number;
  category_id?: string;
  due_day?: number;
  is_active: boolean;
  client_id?: string;
  source?: string; // 'manual' | 'client'
  created_at?: string;
}

export interface FinRecurrenceWithCategory extends FinRecurrence {
  category?: FinCategory;
}
