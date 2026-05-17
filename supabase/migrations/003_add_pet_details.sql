-- Adiciona colunas de detalhe ao pets caso ainda não existam
alter table public.pets
  add column if not exists sexo text check (sexo in ('Macho', 'Fêmea')),
  add column if not exists porte text check (porte in ('Pequeno', 'Médio', 'Grande')),
  add column if not exists recompensa boolean not null default false,
  add column if not exists status text not null default 'perdido' check (status in ('perdido'));
