-- Ábaco del Tiempo · Esquema base
-- Tablas, funciones de apoyo y disparadores. Las políticas RLS están en la migración 0002.

-- ---------------------------------------------------------------------------
-- Esquema privado: funciones que NO se exponen por la API REST
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfiles y roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contenido
-- ---------------------------------------------------------------------------
create table public.site_config (
  id                    int primary key default 1 check (id = 1),
  title                 text not null default 'Ábaco del Tiempo',
  subtitle              text not null default 'Rutas del conocimiento matemático — Portafolio Digital Académico',
  motto                 text not null default 'Aprender, crear y transformar el conocimiento',
  course                text not null default 'Historia de las Matemáticas',
  university            text not null default 'Universidad Nacional Abierta y a Distancia (UNAD)',
  center                text not null default 'Centro José Celestino Mutis, Bogotá',
  program               text not null default 'Licenciatura en Matemáticas',
  teacher               text not null default '[Por completar]',
  period                text not null default '[Por completar]',
  group_name            text not null default '[Por completar]',
  intro_text            text not null default '',
  purpose               text not null default '',
  general_objective     text not null default '',
  specific_objectives   jsonb not null default '[]'::jsonb,
  timeline_text         text not null default '',
  timeline_learned      text not null default '[Por completar]',
  videos_intro          text not null default '',
  group_reflection      text not null default '',
  reflection_knowledge  text not null default '[Por completar]',
  reflection_skills     text not null default '[Por completar]',
  reflection_experience text not null default '[Por completar]',
  team_text             text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.moments (
  id          text primary key check (id in ('inicial', 'intermedio', 'final')),
  title       text not null,
  color       text not null,
  description text not null default '',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.phases (
  id             int primary key check (id > 0),
  moment_id      text not null references public.moments (id),
  title          text not null,
  rac            text not null,
  description    text not null default '[Por completar]',
  start_date     date,
  end_date       date,
  status         text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'entregada')),
  que_aprendimos text not null default '[Por completar]',
  position       int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  topic        text not null,
  role         text not null default '[Por completar]',
  contribution text not null default '[Por completar]',
  program      text not null default 'Licenciatura en Matemáticas',
  photo_path   text,
  position     int  not null default 0,
  user_id      uuid unique references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Correos de los integrantes (privado: solo administración).
-- Al crear/invitar una cuenta con ese correo, se enlaza sola con su ficha.
create table public.member_emails (
  email       text primary key,
  member_id   uuid not null references public.members (id) on delete cascade,
  grant_admin boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint member_emails_lowercase check (email = lower(email))
);

create table public.phase_deliverables (
  id          uuid primary key default gen_random_uuid(),
  phase_id    int  not null unique references public.phases (id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  mime_type   text not null check (mime_type in (
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes  bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  uploaded_by uuid references auth.users (id) on delete set null,
  uploaded_by_name text,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'otro'
              check (kind in ('infografia', 'presentacion', 'actividad', 'mapa_mental', 'juego', 'otro', 'timeline')),
  title       text not null,
  url         text not null,
  embed_url   text,
  cover_path  text,
  description text not null default '',
  phase_id    int references public.phases (id) on delete set null,
  position    int not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  url           text not null,
  embed_url     text,
  platform      text,
  thumbnail_url text,
  participants  text not null default '',
  duration      text not null default '',
  description   text not null default '',
  credits       text not null default '',
  behind_scenes jsonb not null default '{}'::jsonb,
  phase_id      int references public.phases (id) on delete set null,
  position      int not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.evidences (
  id          uuid primary key default gen_random_uuid(),
  image_path  text not null,
  thumb_path  text,
  title       text not null check (char_length(btrim(title)) > 0),
  description text not null check (char_length(btrim(description)) > 0),
  category    text not null default 'otros'
              check (category in ('capturas', 'conversaciones', 'foro', 'grabaciones',
                                  'bocetos', 'investigacion', 'diseno', 'otros')),
  phase_id    int references public.phases (id) on delete set null,
  member_ids  uuid[] not null default '{}',
  taken_on    date,
  position    int not null default 0,
  published   boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.reflections (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members (id) on delete cascade,
  phase_id          int  not null references public.phases (id) on delete cascade,
  aprendi           text not null default '' check (char_length(aprendi) <= 4000),
  dificulto         text not null default '' check (char_length(dificulto) <= 4000),
  sorprendio        text not null default '' check (char_length(sorprendio) <= 4000),
  quisiera_aprender text not null default '' check (char_length(quisiera_aprender) <= 4000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (member_id, phase_id)
);

create table public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  options       jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index int  not null check (correct_index >= 0),
  explanation   text not null default '',
  topic         text,
  position      int not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Nota: "references" es palabra reservada de SQL, por eso se llama bibliography_refs.
create table public.bibliography_refs (
  id         uuid primary key default gen_random_uuid(),
  apa_text   text not null,
  kind       text not null default 'web'
             check (kind in ('libro', 'articulo', 'web', 'imagen', 'video', 'recurso', 'herramienta')),
  url        text,
  authors    text,
  year       text,
  position   int not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de las llaves foráneas usadas en consultas
create index on public.phases (moment_id);
create index on public.member_emails (member_id);
create index on public.resources (phase_id);
create index on public.videos (phase_id);
create index on public.evidences (phase_id);
create index on public.reflections (phase_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'site_config', 'moments', 'phases', 'members', 'member_emails',
    'phase_deliverables', 'resources', 'videos', 'evidences', 'reflections',
    'quiz_questions', 'bibliography_refs'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Funciones de rol (SECURITY DEFINER en esquema privado: no se exponen por API)
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members where user_id = (select auth.uid())
  );
$$;

create or replace function private.owns_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where id = p_member_id and user_id = (select auth.uid())
  );
$$;

grant execute on function private.is_admin()          to anon, authenticated;
grant execute on function private.is_member()         to anon, authenticated;
grant execute on function private.owns_member(uuid)   to anon, authenticated;

-- Enlaza una cuenta con su ficha de integrante y le asigna el rol.
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
  values (p_user_id, case when coalesce(v_grant_admin, false) then 'admin' else 'member' end)
  on conflict (user_id) do update
    set role = case when coalesce(v_grant_admin, false) then 'admin' else public.profiles.role end;

  if v_member_id is not null then
    update public.members set user_id = p_user_id where id = v_member_id;
  end if;
end;
$$;
revoke all on function private.link_user(uuid, text) from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.link_user(new.id, new.email);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
