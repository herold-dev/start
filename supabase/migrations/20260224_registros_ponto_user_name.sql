-- Add user_name column to registros_ponto
ALTER TABLE public.registros_ponto ADD COLUMN user_name TEXT;

-- Function to get the name from auth.users metadata and populate user_name
CREATE OR REPLACE FUNCTION public.set_user_name_on_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SELECT COALESCE(
        (raw_user_meta_data->>'name')::text,
        split_part(email, '@', 1)
    )
    INTO NEW.user_name
    FROM auth.users
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Trigger to fire before insert or update
CREATE TRIGGER tr_set_user_name_on_ponto
    BEFORE INSERT OR UPDATE ON public.registros_ponto
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_name_on_ponto();

-- Update existing records if any
UPDATE public.registros_ponto SET user_name = user_name WHERE user_name IS NULL;
