-- Tabela de pets perdidos vinculada ao auth.users
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('cachorro', 'gato', 'outro')),
  descricao text,
  cidade text not null,
  bairro text not null,
  sexo text check (sexo in ('Macho', 'Fêmea')),
  porte text check (porte in ('Pequeno', 'Médio', 'Grande')),
  recompensa boolean not null default false,
  status text not null default 'perdido' check (status in ('perdido')),
  created_at timestamptz not null default now()
);

alter table public.pets enable row level security;

-- Qualquer usuário autenticado pode visualizar pets perdidos
create policy "pets_select_authenticated"
  on public.pets
  for select
  to authenticated
  using (true);

-- Usuário só insere pet para si mesmo
create policy "pets_insert_own"
  on public.pets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Usuário só atualiza seus próprios pets
create policy "pets_update_own"
  on public.pets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Usuário só deleta seus próprios pets
create policy "pets_delete_own"
  on public.pets
  for delete
  to authenticated
  using (auth.uid() = user_id);
