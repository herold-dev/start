-- ===================================================================
-- Tabela: client_contents (Calendário de Conteúdo)
-- ===================================================================
CREATE TABLE IF NOT EXISTS client_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'carrossel',   -- carrossel | estatico | reels
  status TEXT NOT NULL DEFAULT 'rascunho',          -- rascunho | em_aprovacao | ajuste | aprovado
  channel TEXT DEFAULT 'instagram',                 -- instagram | tiktok | youtube | linkedin
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_contents_client ON client_contents(client_id);
CREATE INDEX idx_client_contents_date ON client_contents(scheduled_date);

-- ===================================================================
-- Tabela: client_notes (Abas de anotações do cliente)
-- ===================================================================
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tab TEXT NOT NULL,           -- diagnostico | persona | concorrencia | posicionamento | produtos | ia
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, tab)
);

-- ===================================================================
-- Row Level Security
-- ===================================================================
ALTER TABLE client_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contents_full_access"
  ON client_contents FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "client_notes_full_access"
  ON client_notes FOR ALL USING (true) WITH CHECK (true);
