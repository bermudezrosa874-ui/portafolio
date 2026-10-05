-- Ábaco del Tiempo · Seguridad a nivel de fila (RLS)
-- Visitante: solo lectura de lo publicado. Integrante: sus reflexiones y evidencias en borrador.
-- Administrador: todo.

-- Los visitantes nunca escriben; se retira el permiso de raíz además de la RLS.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Tablas de lectura pública total + escritura solo admin
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_config', 'moments', 'phases', 'members'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "lectura publica" on public.%I for select to anon, authenticated using (true)', t);
    execute format(
      'create policy "admin inserta" on public.%I for insert to authenticated
         with check ((select private.is_admin()))', t);
    execute format(
      'create policy "admin actualiza" on public.%I for update to authenticated
         using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format(
      'create policy "admin elimina" on public.%I for delete to authenticated
         using ((select private.is_admin()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Tablas con interruptor publicado/borrador
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'phase_deliverables', 'resources', 'videos', 'quiz_questions', 'bibliography_refs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "lectura publicada" on public.%I for select to anon, authenticated
         using (published or (select private.is_admin()))', t);
    execute format(
      'create policy "admin inserta" on public.%I for insert to authenticated
         with check ((select private.is_admin()))', t);
    execute format(
      'create policy "admin actualiza" on public.%I for update to authenticated
         using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format(
      'create policy "admin elimina" on public.%I for delete to authenticated
         using ((select private.is_admin()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles y member_emails: privadas
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "ver mi perfil" on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "admin inserta perfiles" on public.profiles for insert to authenticated
  with check ((select private.is_admin()));
create policy "admin actualiza perfiles" on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin elimina perfiles" on public.profiles for delete to authenticated
  using ((select private.is_admin()));

alter table public.member_emails enable row level security;
create policy "admin ve correos" on public.member_emails for select to authenticated
  using ((select private.is_admin()));
create policy "admin inserta correos" on public.member_emails for insert to authenticated
  with check ((select private.is_admin()));
create policy "admin actualiza correos" on public.member_emails for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin elimina correos" on public.member_emails for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- reflections: lectura pública; cada integrante escribe solo las suyas
-- ---------------------------------------------------------------------------
alter table public.reflections enable row level security;
create policy "lectura publica" on public.reflections for select to anon, authenticated
  using (true);
create policy "inserta propias o admin" on public.reflections for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_member(member_id)));
create policy "actualiza propias o admin" on public.reflections for update to authenticated
  using ((select private.is_admin()) or (select private.owns_member(member_id)))
  with check ((select private.is_admin()) or (select private.owns_member(member_id)));
create policy "admin elimina" on public.reflections for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- evidences: públicas si están publicadas; el integrante sube en borrador y admin aprueba
-- ---------------------------------------------------------------------------
alter table public.evidences enable row level security;
create policy "lectura publicada o propia" on public.evidences for select to anon, authenticated
  using (published or created_by = (select auth.uid()) or (select private.is_admin()));
create policy "inserta admin o integrante en borrador" on public.evidences for insert to authenticated
  with check (
    (select private.is_admin())
    or ((select private.is_member()) and published = false and created_by = (select auth.uid()))
  );
create policy "admin actualiza" on public.evidences for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "elimina admin o autor en borrador" on public.evidences for delete to authenticated
  using (
    (select private.is_admin())
    or (created_by = (select auth.uid()) and published = false)
  );
