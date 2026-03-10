-- Criação da tabela de credenciais de clientes com campos encriptados
CREATE EXTENSION IF NOT EXISTS pgcrypto;

create table if not exists public.client_credentials (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  platform text not null, -- Ex: 'Instagram', 'TikTok', 'Hostgator'
  username text not null, -- Ex: 'startdigital', 'contato@start.com'
  encrypted_password text not null, -- Senha guardada em PGP Simétrico
  login_url text, -- Link direto pra tela de login
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.client_credentials enable row level security;

-- Política de Leitura: Apenas usuários autenticados da agência
create policy "Usuários podem ver credenciais dos clientes que gerenciam"
  on public.client_credentials for select
  using ( auth.uid() is not null );

-- Política de Inserção
create policy "Usuários autenticados podem inserir credenciais"
  on public.client_credentials for insert
  with check ( auth.uid() is not null );

-- Política de Atualização
create policy "Usuários autenticados podem atualizar credenciais"
  on public.client_credentials for update
  using ( auth.uid() is not null );

-- Política de Deleção
create policy "Usuários autenticados podem deletar credenciais"
  on public.client_credentials for delete
  using ( auth.uid() is not null );

-- Trigger de updated_at
create trigger handle_updated_at before update on public.client_credentials
  for each row execute procedure moddatetime (updated_at);
