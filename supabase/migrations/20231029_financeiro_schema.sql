-- Tabelas para o módulo Financeiro

-- 1. Categorias
CREATE TABLE public.fin_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    color TEXT DEFAULT '#8b5cf6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Transações (Entradas e Saídas)
CREATE TABLE public.fin_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    client_name TEXT,
    category_id UUID REFERENCES public.fin_categories(id) ON DELETE SET NULL,
    value NUMERIC(15,2) DEFAULT 0 NOT NULL,
    status TEXT NOT NULL, 
    pgto_method TEXT,
    is_recurrent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para desenvolvimento)
CREATE POLICY "Permitir acesso total fin_categories" ON public.fin_categories FOR ALL USING (true);
CREATE POLICY "Permitir acesso total fin_transactions" ON public.fin_transactions FOR ALL USING (true);

-- Inserir categorias padrão
INSERT INTO public.fin_categories (name, type, color) VALUES
('Consultoria', 'entrada', '#10b981'),
('Gestão de Conteúdo', 'entrada', '#3b82f6'),
('Tráfego Pago', 'saida', '#ef4444'),
('Escritório', 'saida', '#f59e0b'),
('Equipe', 'saida', '#8b5cf6');
