-- Ábaco del Tiempo · Colaboradores, aportes del equipo, notificaciones y actividad
--
-- Roles: admin (Rosa) · collaborator (los otros 4 integrantes) · user (cuenta sin ficha de integrante).
-- Todo se valida aquí, en la base de datos (RLS + disparadores): ocultar botones no basta.

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'collaborator' where role = 'member';
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'collaborator', 'user'));
alter table public.profiles alter column role set default 'user';

create or replace function private.is_collaborator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'collaborator'
  );
$$;
grant execute on function private.is_collaborator() to anon, authenticated;

-- Quien tiene ficha de integrante o rol colaborador puede subir evidencias en borrador.
create or replace function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.members where user_id = (select auth.uid()))
      or exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'collaborator');
$$;

-- Una cuenta enlazada a una ficha de integrante es colaboradora; si no, usuaria simple.
create or replace function private.link_user(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id   uuid;
  v_grant_admin boolean;
begin
  select member_id, grant_admin
    into v_member_id, v_grant_admin
    from public.member_emails
   where email = lower(p_email);

  insert into public.profiles (user_id, role)
  values (
    p_user_id,
    case when coalesce(v_grant_admin, false) then 'admin'
         when v_member_id is not null then 'collaborator'
         else 'user' end
  )
  on conflict (user_id) do update
    set role = case
      when coalesce(v_grant_admin, false) then 'admin'
      when public.profiles.role = 'user' and v_member_id is not null then 'collaborator'
      else public.profiles.role end;

  if v_member_id is not null then
    update public.members set user_id = null where user_id = p_user_id and id <> v_member_id;
    update public.members set user_id = p_user_id where id = v_member_id;
  end if;
end;
$$;
revoke all on function private.link_user(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Protección de la administradora: nunca puede quedar el portafolio sin admin
-- ---------------------------------------------------------------------------
create or replace function private.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role is distinct from 'admin')
     and not exists (select 1 from public.profiles where role = 'admin' and user_id <> old.user_id)
  then
    raise exception 'No se puede quitar ni degradar a la única administradora del portafolio.'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.protect_last_admin() from public, anon, authenticated;

create trigger protect_last_admin
  before update of role or delete on public.profiles
  for each row execute function private.protect_last_admin();

-- Desde la API, solo la administradora cambia roles (un colaborador no puede ascenderse).
-- Sin sesión (disparadores internos de registro) no aplica.
create or replace function private.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.is_admin() then
    raise exception 'Solo la administradora puede cambiar roles.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_role_change() from public, anon, authenticated;

create trigger guard_role_change
  before update of role on public.profiles
  for each row execute function private.guard_role_change();

-- Aplica el nuevo criterio a las cuentas que ya existen (después de crear los disparadores).
select private.link_user(u.id, u.email)
from auth.users u
where exists (select 1 from public.member_emails me where me.email = lower(u.email));

-- ---------------------------------------------------------------------------
-- 3. Nombres completos del equipo (Rosa es la administradora)
-- ---------------------------------------------------------------------------
update public.members set name = 'Rosalinda Bermudez Urbay'    where position = 1;
update public.members set name = 'Johana Lemus Cuesta'         where position = 2;
update public.members set name = 'Luis Fernando Arango Duarte' where position = 3;
update public.members set name = 'Juan Stiven Naranjo Silva'   where position = 4;
update public.members set name = 'Frank Alvares Torres'
  where position = 5 and name like '[[]Integrante 5%';

-- ---------------------------------------------------------------------------
-- 4. Aportes del equipo
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contributions', 'contributions', true, 52428800,
  array['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table public.contributions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(btrim(title)) between 1 and 160),
  description      text not null default '' check (char_length(description) <= 2000),
  kind             text not null default 'documento'
                   check (kind in ('documento', 'presentacion', 'imagen', 'video', 'enlace')),
  category         text not null default 'otros'
                   check (category in ('entregas', 'investigacion', 'entrevistas', 'recursos', 'imagenes', 'otros')),
  url              text check (url is null or url ~* '^https?://'),
  file_path        text,
  file_name        text,
  mime_type        text,
  size_bytes       bigint check (size_bytes is null or size_bytes > 0),
  phase_id         int references public.phases (id) on delete set null,
  status           text not null default 'pending_review'
                   check (status in ('draft', 'pending_review', 'published', 'hidden')),
  published        boolean not null default false,
  uploaded_by      uuid not null references auth.users (id) on delete restrict,
  uploaded_by_name text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Un aporte es un archivo o un enlace, nunca vacío.
  constraint contribution_has_content check (file_path is not null or url is not null),
  -- El archivo debe vivir en la carpeta de quien lo sube: <uid>/...
  constraint contribution_own_folder check (file_path is null or file_path like uploaded_by::text || '/%')
);
create index on public.contributions (uploaded_by);
create index on public.contributions (status);
create index on public.contributions (phase_id);

create trigger set_updated_at before update on public.contributions
  for each row execute function private.set_updated_at();

-- Reglas de propiedad y de estado que el cliente no puede saltarse.
create or replace function private.contribution_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if tg_op = 'INSERT' then
    -- El autor de un colaborador es siempre quien tiene la sesión, nunca lo que diga el cliente.
    if not v_admin then new.uploaded_by := (select auth.uid()); end if;
    -- Este nombre se muestra públicamente: nunca cae al correo, solo al nombre de la ficha.
    new.uploaded_by_name := coalesce(
      (select m.name from public.members m where m.user_id = new.uploaded_by limit 1), 'Integrante');
    if not v_admin and new.status not in ('draft', 'pending_review') then
      new.status := 'pending_review';
    end if;
  else
    -- La autoría no se reasigna ni se falsifica.
    new.uploaded_by := old.uploaded_by;
    new.uploaded_by_name := old.uploaded_by_name;
    new.created_at := old.created_at;
    if not v_admin then
      -- Un colaborador que edita su aporte lo devuelve a revisión: nunca se publica solo.
      new.status := case when new.status = 'draft' then 'draft' else 'pending_review' end;
    end if;
  end if;
  new.published := (new.status = 'published');
  return new;
end;
$$;
revoke all on function private.contribution_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Notificaciones para la administradora y registro de actividad
-- ---------------------------------------------------------------------------
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null check (kind in ('new_contribution', 'updated_contribution')),
  title           text not null,
  actor_id        uuid references auth.users (id) on delete set null,
  actor_name      text not null default '',
  contribution_id uuid references public.contributions (id) on delete cascade,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on public.notifications (read, created_at desc);

create table public.activity_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete set null,
  user_name      text not null default '',
  action         text not null check (action in
                 ('LOGIN', 'UPLOAD_RESOURCE', 'UPDATE_RESOURCE', 'REPLACE_FILE', 'DELETE_RESOURCE', 'PUBLISH_RESOURCE')),
  resource_id    uuid,
  resource_title text not null default '',
  created_at     timestamptz not null default now()
);
create index on public.activity_log (created_at desc);
create index on public.activity_log (user_id);

create or replace function private.actor_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select m.name from public.members m where m.user_id = p_user limit 1),
    (select u.email from auth.users u where u.id = p_user), '');
$$;
revoke all on function private.actor_name(uuid) from public, anon, authenticated;

create trigger contribution_guard before insert or update on public.contributions
  for each row execute function private.contribution_guard();

create or replace function private.contribution_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_actor text;
begin
  v_actor := private.actor_name(coalesce(v_uid, new.uploaded_by, old.uploaded_by));

  if tg_op = 'INSERT' then
    insert into public.activity_log (user_id, user_name, action, resource_id, resource_title)
    values (v_uid, v_actor, 'UPLOAD_RESOURCE', new.id, new.title);
    -- Rosa se entera de lo que suben los demás (no de lo que sube ella misma ni de los borradores).
    if new.status <> 'draft' and not private.is_admin() then
      insert into public.notifications (kind, title, actor_id, actor_name, contribution_id)
      values ('new_contribution', new.title, new.uploaded_by, v_actor, new.id);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.file_path is distinct from old.file_path then
      insert into public.activity_log (user_id, user_name, action, resource_id, resource_title)
      values (v_uid, v_actor, 'REPLACE_FILE', new.id, new.title);
    elsif new.status is distinct from old.status and new.status = 'published' and private.is_admin() then
      insert into public.activity_log (user_id, user_name, action, resource_id, resource_title)
      values (v_uid, v_actor, 'PUBLISH_RESOURCE', new.id, new.title);
    else
      insert into public.activity_log (user_id, user_name, action, resource_id, resource_title)
      values (v_uid, v_actor, 'UPDATE_RESOURCE', new.id, new.title);
    end if;
    if not private.is_admin() and new.status = 'pending_review' then
      insert into public.notifications (kind, title, actor_id, actor_name, contribution_id)
      values ('updated_contribution', new.title, new.uploaded_by, v_actor, new.id);
    end if;
    return new;
  else
    insert into public.activity_log (user_id, user_name, action, resource_id, resource_title)
    values (v_uid, v_actor, 'DELETE_RESOURCE', old.id, old.title);
    return old;
  end if;
end;
$$;
revoke all on function private.contribution_audit() from public, anon, authenticated;

create trigger contribution_audit after insert or update or delete on public.contributions
  for each row execute function private.contribution_audit();

-- Registro de inicio de sesión: solo guarda quién y cuándo (sin contraseñas ni tokens).
create or replace function public.log_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then return; end if;
  -- Un LOGIN por usuario cada 10 minutos, para no llenar el registro al refrescar la página.
  if exists (select 1 from public.activity_log
             where user_id = v_uid and action = 'LOGIN' and created_at > now() - interval '10 minutes') then
    return;
  end if;
  insert into public.activity_log (user_id, user_name, action)
  values (v_uid, private.actor_name(v_uid), 'LOGIN');
end;
$$;
revoke all on function public.log_login() from public, anon;
grant execute on function public.log_login() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
alter table public.contributions enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;

create policy "lectura publicada o propia" on public.contributions for select to anon, authenticated
  using (published or uploaded_by = (select auth.uid()) or (select private.is_admin()));
create policy "inserta admin o colaborador" on public.contributions for insert to authenticated
  with check (
    (select private.is_admin())
    or ((select private.is_collaborator()) and uploaded_by = (select auth.uid()))
  );
-- Un colaborador solo toca lo suyo; si no es suyo la fila ni siquiera es visible para el UPDATE.
create policy "actualiza propios o admin" on public.contributions for update to authenticated
  using ((select private.is_admin()) or uploaded_by = (select auth.uid()))
  with check ((select private.is_admin()) or uploaded_by = (select auth.uid()));
create policy "elimina propios o admin" on public.contributions for delete to authenticated
  using ((select private.is_admin()) or uploaded_by = (select auth.uid()));

create policy "admin ve notificaciones" on public.notifications for select to authenticated
  using ((select private.is_admin()));
create policy "admin marca notificaciones" on public.notifications for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin borra notificaciones" on public.notifications for delete to authenticated
  using ((select private.is_admin()));
create policy "admin ve actividad" on public.activity_log for select to authenticated
  using ((select private.is_admin()));

-- Nadie inserta directo en notificaciones/actividad: solo los disparadores y log_login.
revoke insert, update, delete, truncate on public.contributions, public.notifications, public.activity_log from anon;
revoke insert, truncate on public.notifications, public.activity_log from authenticated;
revoke update, delete on public.activity_log from authenticated;

-- Storage: cada colaborador escribe solo en su carpeta <uid>/ del bucket "contributions".
create policy "contribuciones: subir" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'contributions'
    and (
      (select private.is_admin())
      or (
        (select private.is_collaborator())
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    )
  );
create policy "contribuciones: ver propios o admin" on storage.objects for select to authenticated
  using (
    bucket_id = 'contributions'
    and ((select private.is_admin()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  );
create policy "contribuciones: reemplazar propios o admin" on storage.objects for update to authenticated
  using (
    bucket_id = 'contributions'
    and ((select private.is_admin()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  )
  with check (
    bucket_id = 'contributions'
    and ((select private.is_admin()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  );
create policy "contribuciones: eliminar propios o admin" on storage.objects for delete to authenticated
  using (
    bucket_id = 'contributions'
    and ((select private.is_admin()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  );
