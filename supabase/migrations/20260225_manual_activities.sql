create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.usuarios(id) on delete set null,
  due_date date,
  status text check (status in ('pendente', 'concluida')) default 'pendente',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.activities enable row level security;

-- Políticas de RLS
create policy "Atividades visíveis para todos os usuários autenticados"
  on public.activities for select
  to authenticated
  using (true);

create policy "Usuários podem inserir atividades"
  on public.activities for insert
  to authenticated
  with check (true);

create policy "Usuários podem atualizar qualquer atividade"
  on public.activities for update
  to authenticated
  using (true);

create policy "Usuários podem excluir atividades"
  on public.activities for delete
  to authenticated
  using (true);
