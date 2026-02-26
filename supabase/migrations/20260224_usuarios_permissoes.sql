-- Tabela de perfis / usuários para permissões customizadas
create table if not exists public.usuarios (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  role text default 'membro',
  permissoes jsonb default '["dashboard"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
alter table public.usuarios enable row level security;

-- Políticas de RLS
-- Qualquer usuário logado pode vizualizar a tabela de usuarios (necessário para listar a equipe e o próprio AuthContext)
create policy "Usuarios visiveis para autenticados"
  on public.usuarios for select
  to authenticated
  using (true);

-- Apenas admins podem atualizar os usuários.  Para checar se é admin:
create policy "Apenas admins podem atualizar usuarios"
  on public.usuarios for update
  to authenticated
  using (
    exists (
      select 1 from public.usuarios 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Trigger para criar o perfil de usuário automaticamente ao se registrar
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.usuarios (id, email, nome, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'membro') -- Pode herdar o role dos metadados iniciais se for definido
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Já inserir os usuários que existem atualmente no banco
insert into public.usuarios (id, email, nome, role)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'name', email),
  coalesce(raw_user_meta_data->>'role', 'membro')
from auth.users
on conflict (id) do nothing;
