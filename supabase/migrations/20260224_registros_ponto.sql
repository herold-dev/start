-- Create the table
CREATE TABLE public.registros_ponto (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIME NOT NULL DEFAULT CURRENT_TIME,
    hora_saida TIME,
    descricao_atividades TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, data_registro)
);

-- Enable RLS
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- Policies for records
CREATE POLICY "Users can view their own records"
    ON public.registros_ponto
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
    ON public.registros_ponto
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
    ON public.registros_ponto
    FOR UPDATE
    USING (auth.uid() = user_id);
