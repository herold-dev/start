-- Permitir status 'nao_agendada'
ALTER TABLE captures DROP CONSTRAINT captures_status_check;
ALTER TABLE captures ADD CONSTRAINT captures_status_check CHECK (status IN ('agendada', 'realizada', 'cancelada', 'nao_agendada'));

-- Permitir data nula se for nao_agendada
ALTER TABLE captures ALTER COLUMN capture_date DROP NOT NULL;
