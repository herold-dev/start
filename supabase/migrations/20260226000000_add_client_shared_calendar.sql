-- Adicionando a configuração de compartilhamento de calendário na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS shared_calendar_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_calendar_password TEXT;
