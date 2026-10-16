-- Ábaco del Tiempo · Fecha de apertura de cada fase
--
-- La fase 4 abre el 26 de octubre y la fase 5 el 23 de noviembre (hora de Bogotá). Hasta ese día no se puede
-- subir ni escribir nada en ellas, tampoco la administradora. Se puede cambiar la fecha desde «Fases y entregas».
alter table public.phases add column if not exists opens_at date;

update public.phases set opens_at = date '2026-10-26' where id = 4;
update public.phases set opens_at = date '2026-11-23' where id = 5;

-- Una fase sin fecha de apertura está abierta.
create or replace function private.phase_is_open(p_phase int)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.opens_at is null or p.opens_at <= (now() at time zone 'America/Bogota')::date
       from public.phases p where p.id = p_phase),
    true
  );
$$;
revoke all on function private.phase_is_open(int) from public, anon, authenticated;

create or replace function private.block_unopened_phase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phase_id is not null and not private.phase_is_open(new.phase_id) then
    raise exception 'Esta fase todavía no está abierta.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.block_unopened_phase() from public, anon, authenticated;

-- Todo lo que se vincula a una fase: crear algo nuevo o moverlo a una fase cerrada queda bloqueado.
create trigger block_unopened_phase before insert or update of phase_id on public.resources
  for each row execute function private.block_unopened_phase();
create trigger block_unopened_phase before insert or update of phase_id on public.videos
  for each row execute function private.block_unopened_phase();
create trigger block_unopened_phase before insert or update of phase_id on public.evidences
  for each row execute function private.block_unopened_phase();
create trigger block_unopened_phase before insert or update of phase_id on public.contributions
  for each row execute function private.block_unopened_phase();
create trigger block_unopened_phase before insert or update of phase_id on public.phase_deliverables
  for each row execute function private.block_unopened_phase();
create trigger block_unopened_phase before insert or update of phase_id on public.phase_activities
  for each row execute function private.block_unopened_phase();
-- La bitácora se escribe y se edita por fase: tampoco se puede tocar mientras la fase está cerrada.
create trigger block_unopened_phase before insert or update on public.reflections
  for each row execute function private.block_unopened_phase();
