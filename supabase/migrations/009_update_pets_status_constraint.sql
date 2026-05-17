update public.pets
set status = 'perdido'
where status is null
   or status not in ('perdido', 'encontrado');

alter table public.pets
  alter column status set default 'perdido';

alter table public.pets
  alter column status set not null;

alter table public.pets
  drop constraint if exists pets_status_check;

alter table public.pets
  drop constraint if exists pets_status_check1;

alter table public.pets
  add constraint pets_status_check
  check (status in ('perdido', 'encontrado'));
