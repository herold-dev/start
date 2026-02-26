-- ===================================================================
-- Adicionar colunas de conteúdo detalhado às 4 abas do editor
-- ===================================================================
ALTER TABLE client_contents
  ADD COLUMN IF NOT EXISTS tema_content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tema_status TEXT DEFAULT 'rascunho',

  ADD COLUMN IF NOT EXISTS conteudo_content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS conteudo_status TEXT DEFAULT 'rascunho',

  ADD COLUMN IF NOT EXISTS midia_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS midia_status TEXT DEFAULT 'rascunho',

  ADD COLUMN IF NOT EXISTS legenda_content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS legenda_status TEXT DEFAULT 'rascunho';
