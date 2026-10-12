-- Ábaco del Tiempo · Actividades de cada fase (con fecha)
--
-- Rosa y los colaboradores agregan actividades a una fase; cada quien edita y elimina solo las suyas
-- (Rosa, todas). Se ven públicamente de inmediato. Las reglas viven aquí, no en la interfaz.

create table public.phase_activities (
  id               uuid primary key default gen_random_uuid(),
  phase_id         int  not null references public.phases (id) on delete cascade,
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  description      text not null default '' check (char_length(description) <= 1000),
  activity_date    date not null,
  created_by       uuid references auth.users (id) on delete set null,
  created_by_name  text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on public.phase_activities (phase_id, activity_date);
create index on public.phase_activities (created_by);

create trigger set_updated_at before update on public.phase_activities
  for each row execute function private.set_updated_at();

-- La autoría la fija el servidor: nadie puede registrar una actividad a nombre de otra persona.
create or replace function private.phase_activity_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
    -- Este nombre se muestra públicamente: solo el de la ficha, nunca el correo.
    new.created_by_name := coalesce(
      (select m.name from public.members m where m.user_id = new.created_by limit 1), 'Integrante');
  else
    new.created_by := old.created_by;
    new.created_by_name := old.created_by_name;
    new.phase_id := old.phase_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
revoke all on function private.phase_activity_guard() from public, anon, authenticated;

create trigger phase_activity_guard before insert or update on public.phase_activities
  for each row execute function private.phase_activity_guard();

alter table public.phase_activities enable row level security;

create policy "lectura publica" on public.phase_activities for select to anon, authenticated
  using (true);
create policy "inserta admin o colaborador" on public.phase_activities for insert to authenticated
  with check ((select private.is_admin()) or (select private.is_collaborator()));
create policy "actualiza propias o admin" on public.phase_activities for update to authenticated
  using ((select private.is_admin()) or created_by = (select auth.uid()))
  with check ((select private.is_admin()) or created_by = (select auth.uid()));
create policy "elimina propias o admin" on public.phase_activities for delete to authenticated
  using ((select private.is_admin()) or created_by = (select auth.uid()));

revoke insert, update, delete, truncate on public.phase_activities from anon;
