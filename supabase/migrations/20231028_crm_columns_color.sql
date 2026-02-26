-- Adicionar o campo "color" à tabela de colunas do CRM
ALTER TABLE public.crm_columns 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8b5cf6';
