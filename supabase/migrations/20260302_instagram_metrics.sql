-- Migration: Tabela de Métricas do Instagram por cliente (por mês)
-- Data: 2026-03-02

CREATE TABLE instagram_metrics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period            text NOT NULL,           -- formato "YYYY-MM", ex: "2025-03"
  seguidores        integer,
  alcance           integer,
  impressoes        integer,
  visualizacoes     integer,
  interacoes        integer,
  cliques_perfil    integer,
  salvamentos       integer,
  compartilhamentos integer,
  novos_seguidores  integer,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(client_id, period)
);

-- RLS: somente usuários autenticados podem ler/escrever
ALTER TABLE instagram_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated"
  ON instagram_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
