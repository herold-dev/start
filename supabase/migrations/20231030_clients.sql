-- ===================================================================
-- Tabela: clients
-- ===================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aba: Informações Básicas
  name TEXT NOT NULL,
  email TEXT,
  social_handle TEXT,           -- @ principal (ex: @username)
  social_link TEXT,             -- URL da rede social
  segment TEXT,                 -- Segmento / Nicho
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',  -- 'Ativo' | 'Inativo'
  city_state TEXT,              -- Cidade / Estado
  origin TEXT,                  -- Origem do Contato

  -- Personalização visual do card
  avatar_url TEXT,
  gradient_from TEXT NOT NULL DEFAULT '#8b5cf6',
  gradient_to TEXT NOT NULL DEFAULT '#6d28d9',

  -- Aba: Contrato & Financeiro
  service_name TEXT,
  contract_url TEXT,
  contract_value NUMERIC(10, 2),
  payment_type TEXT DEFAULT 'mensal',  -- 'mensal' | 'unico' | 'parcelado'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- Row Level Security
-- ===================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_full_access"
  ON clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===================================================================
-- Storage bucket para avatares de clientes
-- (Execute no painel do Supabase ou via SQL Editor)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('client-avatars', 'client-avatars', true)
-- ON CONFLICT DO NOTHING;
-- ===================================================================
