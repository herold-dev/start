-- Update captures table status constraint
ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_status_check;
ALTER TABLE public.captures ADD CONSTRAINT captures_status_check CHECK (status IN ('agendada', 'realizada', 'cancelada', 'nao_agendada'));

-- Allow capture_date to be null when status is 'nao_agendada'
ALTER TABLE public.captures ALTER COLUMN capture_date DROP NOT NULL;
