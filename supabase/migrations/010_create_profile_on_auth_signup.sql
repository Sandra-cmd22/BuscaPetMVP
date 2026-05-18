-- Cria perfil automaticamente sempre que um usuário é criado no auth.users.
-- Isso garante que o registro exista mesmo quando o signUp não retorna sessão imediata.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    nome,
    email,
    avatar_url,
    telefone,
    cidade,
    bairro
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    ),
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(new.raw_user_meta_data ->> 'cidade', ''),
    nullif(new.raw_user_meta_data ->> 'bairro', '')
  )
  on conflict (id) do update set
    nome = coalesce(excluded.nome, public.profiles.nome),
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    telefone = coalesce(excluded.telefone, public.profiles.telefone),
    cidade = coalesce(excluded.cidade, public.profiles.cidade),
    bairro = coalesce(excluded.bairro, public.profiles.bairro);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_auth_user();

-- Backfill para usuários que já existem no auth.users e ainda não possuem perfil.
insert into public.profiles (id, nome, email, avatar_url, telefone, cidade, bairro)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as nome,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  ) as avatar_url,
  nullif(u.raw_user_meta_data ->> 'telefone', '') as telefone,
  nullif(u.raw_user_meta_data ->> 'cidade', '') as cidade,
  nullif(u.raw_user_meta_data ->> 'bairro', '') as bairro
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
