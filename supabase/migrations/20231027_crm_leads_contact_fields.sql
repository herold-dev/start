-- Adicionar novos campos de contato e detalhes à tabela crm_leads
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Direto',
ADD COLUMN IF NOT EXISTS meeting_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;
