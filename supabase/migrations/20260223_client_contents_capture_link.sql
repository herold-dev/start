-- Add precisa_captacao and capture_id to client_contents
ALTER TABLE public.client_contents ADD COLUMN IF NOT EXISTS precisa_captacao BOOLEAN DEFAULT false;
ALTER TABLE public.client_contents ADD COLUMN IF NOT EXISTS capture_id UUID REFERENCES public.captures(id) ON DELETE SET NULL;
