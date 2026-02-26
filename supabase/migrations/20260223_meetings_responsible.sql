-- Migration to add responsible_name and new status "nao_agendada" to meetings

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- Para alterar o CHECK no Postgres, primeiro precisamos droppar o atual.
-- Vamos pegar o nome da constraint. Normalmente é name da tabela_nome_da_coluna_check.
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_status_check;

-- Adicionamos o novo check
ALTER TABLE meetings ADD CONSTRAINT meetings_status_check 
  CHECK (status IN ('nao_agendada', 'agendada', 'realizada', 'cancelada'));

-- Mudamos o default para nao_agendada
ALTER TABLE meetings ALTER COLUMN status SET DEFAULT 'nao_agendada';
