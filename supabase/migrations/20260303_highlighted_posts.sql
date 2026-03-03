-- Migration: Posts em Destaque vinculados a conteúdos existentes
-- Data: 2026-03-03

CREATE TABLE highlighted_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content_id        uuid NOT NULL REFERENCES client_contents(id) ON DELETE CASCADE,
  period            text NOT NULL,              -- "YYYY-MM"
  highlight_reason  text,                       -- "Por que esse post se destacou?"
  highlight_metrics text,                       -- "Em quais métricas se destacou"
  post_url          text,                       -- "Link do post no Instagram"
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(client_id, content_id)
);

-- RLS: somente usuários autenticados podem ler/escrever
ALTER TABLE highlighted_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated"
  ON highlighted_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
