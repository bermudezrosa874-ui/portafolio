-- Ábaco del Tiempo · Recursos, línea de tiempo, entrevistas y entregas: los puede subir Rosa o cualquier colaborador
--
-- Cada quien edita y elimina solo lo que subió (Rosa, todo). La autoría la fija el servidor, no el navegador.

-- ---------------------------------------------------------------------------
-- 1. Autoría en recursos (incluye la línea de tiempo) y en videos (entrevistas)
-- ---------------------------------------------------------------------------
alter table public.resources
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null,
  add column if not exists uploaded_by_name text not null default '';
alter table public.videos
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null,
  add column if not exists uploaded_by_name text not null default '';
create index if not exists resources_uploaded_by_idx on public.resources (uploaded_by);
create index if not exists videos_uploaded_by_idx on public.videos (uploaded_by);

-- Nombre público de quien sube: el de su ficha, nunca el correo.
create or replace function private.uploader_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select m.name from public.members m where m.user_id = p_user limit 1), 'Integrante');
$$;
revoke all on function private.uploader_name(uuid) from public, anon, authenticated;

create or replace function private.set_uploader()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    if v is not null then
      new.uploaded_by := v;
      new.uploaded_by_name := private.uploader_name(v);
    end if;
  else
    new.uploaded_by := old.uploaded_by;
    new.uploaded_by_name := old.uploaded_by_name;
  end if;
  return new;
end;
$$;
revoke all on function private.set_uploader() from public, anon, authenticated;

create trigger set_uploader before insert or update on public.resources
  for each row execute function private.set_uploader();
create trigger set_uploader before insert or update on public.videos
  for each row execute function private.set_uploader();

-- Entregas finales: si cambia el archivo, el autor pasa a ser quien lo cambió.
create or replace function private.deliverable_uploader()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    if v is not null then
      new.uploaded_by := v;
      new.uploaded_by_name := private.uploader_name(v);
    end if;
  elsif new.file_path is distinct from old.file_path and v is not null then
    new.uploaded_by := v;
    new.uploaded_by_name := private.uploader_name(v);
  else
    new.uploaded_by := old.uploaded_by;
    new.uploaded_by_name := old.uploaded_by_name;
  end if;
  return new;
end;
$$;
revoke all on function private.deliverable_uploader() from public, anon, authenticated;

create trigger deliverable_uploader before insert or update on public.phase_deliverables
  for each row execute function private.deliverable_uploader();

-- ---------------------------------------------------------------------------
-- 2. Reglas de acceso (RLS)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['resources', 'videos', 'phase_deliverables'] loop
    execute format('drop policy if exists "lectura publicada" on public.%I', t);
    execute format('drop policy if exists "admin inserta" on public.%I', t);
    execute format('drop policy if exists "admin actualiza" on public.%I', t);
    execute format('drop policy if exists "admin elimina" on public.%I', t);

    execute format(
      'create policy "lectura publicada o propia" on public.%I for select to anon, authenticated
         using (published or uploaded_by = (select auth.uid()) or (select private.is_admin()))', t);
    execute format(
      'create policy "inserta admin o colaborador" on public.%I for insert to authenticated
         with check ((select private.is_admin()) or (select private.is_collaborator()))', t);
    execute format(
      'create policy "actualiza propios o admin" on public.%I for update to authenticated
         using ((select private.is_admin()) or uploaded_by = (select auth.uid()))
         with check ((select private.is_admin()) or uploaded_by = (select auth.uid()))', t);
    execute format(
      'create policy "elimina propios o admin" on public.%I for delete to authenticated
         using ((select private.is_admin()) or uploaded_by = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Archivos: los colaboradores suben entregas y portadas, y manejan solo lo suyo
-- ---------------------------------------------------------------------------
create policy "colaboradores suben entregas y portadas" on storage.objects for insert to authenticated
  with check (bucket_id in ('deliverables', 'covers') and (select private.is_collaborator()));
create policy "colaboradores ven lo propio" on storage.objects for select to authenticated
  using (bucket_id in ('deliverables', 'covers') and owner_id = (select auth.uid())::text);
create policy "colaboradores reemplazan lo propio" on storage.objects for update to authenticated
  using (bucket_id in ('deliverables', 'covers') and owner_id = (select auth.uid())::text)
  with check (bucket_id in ('deliverables', 'covers') and owner_id = (select auth.uid())::text);
create policy "colaboradores eliminan lo propio" on storage.objects for delete to authenticated
  using (bucket_id in ('deliverables', 'covers') and owner_id = (select auth.uid())::text);
