-- Criação das tabelas do CRM (Kanban)

-- Habilitar a extensão uuid-ossp se não estiver ativada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de colunas
CREATE TABLE public.crm_columns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de leads (cards)
CREATE TABLE public.crm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    column_id UUID REFERENCES public.crm_columns(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    content TEXT NOT NULL,
    value NUMERIC(15,2) DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples para permitir leitura/escrita pública (para fins de desenvolvimento/agilidade inicial)
CREATE POLICY "Permitir acesso total crm_columns" ON public.crm_columns FOR ALL USING (true);
CREATE POLICY "Permitir acesso total crm_leads" ON public.crm_leads FOR ALL USING (true);

-- Inserir colunas padrão iniciais
INSERT INTO public.crm_columns (title, order_index) VALUES 
('Leads Novos', 1),
('Contato Feito', 2),
('Proposta Enviada', 3),
('Em Negociação', 4),
('Fechado Ganho', 5);
