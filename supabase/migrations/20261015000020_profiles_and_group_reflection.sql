-- Ábaco del Tiempo · Perfil de cada integrante y reflexión grupal colaborativa
--
-- 1) members: color propio, símbolo favorito, «Sobre mí» y frase favorita.
-- 2) save_member_profile(): cada integrante edita SOLO su perfil (la administradora, el de cualquiera).
--    Se hace con una función y no con RLS directa porque members solo lo escribe la administradora, y así un
--    colaborador nunca puede tocar el nombre, el rol, el tema, el orden ni el color.
-- 3) Fotos: cada integrante sube la suya a la carpeta <uid>/ del bucket «members» (máx. 512 KB; el navegador
--    la comprime a ~300 KB).
-- 4) group_reflection_entries: un aporte por integrante y por tarjeta (Conocimiento, Habilidades, Experiencia).

-- ---------------------------------------------------------------------------
-- 1. Columnas del perfil
-- ---------------------------------------------------------------------------
alter table public.members
  add column if not exists color  text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists symbol text not null default '' check (char_length(symbol) <= 3),
  add column if not exists about  text not null default '' check (char_length(about) <= 200),
  add column if not exists quote  text not null default '' check (char_length(quote) <= 200);

-- Color estable por persona (no cambia si se reordena el equipo): cian, violeta, dorado, azul y rosa.
update public.members set color = case ((position - 1) % 5)
    when 0 then '#06B6D4'
    when 1 then '#7C3AED'
    when 2 then '#F5B942'
    when 3 then '#2563EB'
    else '#EC4899' end
  where color is null;

-- ---------------------------------------------------------------------------
-- 2. Edición del propio perfil
-- ---------------------------------------------------------------------------
create or replace function public.save_member_profile(
  p_member_id    uuid,
  p_symbol       text,
  p_about        text,
  p_quote        text,
  p_contribution text,
  p_photo_path   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old text;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  if not (private.is_admin() or private.owns_member(p_member_id)) then
    raise exception 'Solo puedes editar tu propio perfil.' using errcode = '42501';
  end if;

  select photo_path into v_old from public.members where id = p_member_id;
  if not found then
    raise exception 'No existe ese integrante.' using errcode = 'P0002';
  end if;

  -- La foto nueva debe vivir en la carpeta de quien la guarda; si no cambia, se conserva la actual.
  if p_photo_path is not null and p_photo_path is distinct from v_old
     and p_photo_path not like v_uid::text || '/%' then
    raise exception 'La foto debe estar en tu carpeta.' using errcode = '42501';
  end if;

  update public.members set
    symbol       = btrim(coalesce(p_symbol, '')),
    about        = btrim(coalesce(p_about, '')),
    quote        = btrim(coalesce(p_quote, '')),
    contribution = case when btrim(coalesce(p_contribution, '')) = ''
                        then 'Muy pronto compartiremos su aporte al proyecto.'
                        else btrim(p_contribution) end,
    photo_path   = p_photo_path
  where id = p_member_id;
end;
$$;
revoke all on function public.save_member_profile(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.save_member_profile(uuid, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fotos de integrantes
-- ---------------------------------------------------------------------------
update storage.buckets set file_size_limit = 524288 where id = 'members';

create policy "fotos: el integrante sube la suya" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'members'
    and (select private.is_member())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "fotos: el integrante borra la suya" on storage.objects for delete to authenticated
  using (
    bucket_id = 'members'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 4. Reflexión grupal: un aporte por integrante y tarjeta
-- ---------------------------------------------------------------------------
create table public.group_reflection_entries (
  id         uuid primary key default gen_random_uuid(),
  card       text not null check (card in ('conocimiento', 'habilidades', 'experiencia')),
  member_id  uuid not null references public.members (id) on delete cascade,
  content    text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card, member_id)
);
create index on public.group_reflection_entries (member_id);

create trigger set_updated_at before update on public.group_reflection_entries
  for each row execute function private.set_updated_at();

alter table public.group_reflection_entries enable row level security;

create policy "lectura publica" on public.group_reflection_entries for select to anon, authenticated
  using (true);
create policy "inserta propio o admin" on public.group_reflection_entries for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_member(member_id)));
create policy "actualiza propio o admin" on public.group_reflection_entries for update to authenticated
  using ((select private.is_admin()) or (select private.owns_member(member_id)))
  with check ((select private.is_admin()) or (select private.owns_member(member_id)));
create policy "elimina propio o admin" on public.group_reflection_entries for delete to authenticated
  using ((select private.is_admin()) or (select private.owns_member(member_id)));

revoke insert, update, delete, truncate on public.group_reflection_entries from anon;

-- Si la administradora ya había escrito texto en las tres tarjetas, pasa a ser su aporte (no se pierde).
-- Los textos de espera («Muy pronto…», «[Por completar]») no cuentan como contenido.
insert into public.group_reflection_entries (card, member_id, content)
select c.card, m.id, btrim(c.txt)
from (
  select 'conocimiento' as card, reflection_knowledge as txt from public.site_config where id = 1
  union all select 'habilidades', reflection_skills from public.site_config where id = 1
  union all select 'experiencia', reflection_experience from public.site_config where id = 1
) c
cross join lateral (
  select id from public.members where position = 1 order by created_at limit 1
) m
where btrim(coalesce(c.txt, '')) <> ''
  and c.txt !~* '^\s*(muy pronto|próximamente|\[por completar\])'
on conflict (card, member_id) do nothing;
