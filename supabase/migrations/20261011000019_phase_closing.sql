-- Ábaco del Tiempo · Una fase se puede dar por completa aunque solo tenga el documento
--
-- Muchas fases solo llevan el documento de entrega. Cuando quien lo subió responde que no hizo nada más,
-- la fase se marca como completa y deja de aceptar subidas nuevas (Rosa puede reabrirla).
alter table public.phases add column if not exists uploads_closed boolean not null default false;

-- Rosa y los colaboradores pueden cerrar una fase; reabrirla solo lo hace Rosa (actualizando la fase).
create or replace function public.close_phase_uploads(p_phase int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_collaborator()) then
    raise exception 'No tienes permiso para cerrar la fase.' using errcode = '42501';
  end if;
  update public.phases set uploads_closed = true where id = p_phase;
end;
$$;
revoke all on function public.close_phase_uploads(int) from public, anon;
grant execute on function public.close_phase_uploads(int) to authenticated;

-- En una fase completa, los colaboradores ya no pueden subir recursos, videos ni documentos nuevos.
create or replace function private.block_closed_phase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phase_id is not null
     and exists (select 1 from public.phases p where p.id = new.phase_id and p.uploads_closed)
     and not private.is_admin() then
    raise exception 'Esta fase está completa. Rosa puede reabrirla si falta algo.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.block_closed_phase() from public, anon, authenticated;

create trigger block_closed_phase before insert on public.resources
  for each row execute function private.block_closed_phase();
create trigger block_closed_phase before insert on public.videos
  for each row execute function private.block_closed_phase();
create trigger block_closed_phase before insert on public.phase_deliverables
  for each row execute function private.block_closed_phase();
