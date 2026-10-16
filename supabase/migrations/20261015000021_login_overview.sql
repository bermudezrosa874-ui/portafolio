-- Ábaco del Tiempo · Últimas conexiones de los integrantes (solo la administradora) y mensaje sin nombres
--
-- La última conexión de cada integrante sale de dos fuentes que ya existen:
--   · activity_log (acción LOGIN): una fila por inicio de sesión al entrar al panel (máx. una cada 10 min).
--   · auth.users.last_sign_in_at: lo fija Supabase en cada inicio de sesión exitoso, entre al panel o no.
-- Se toma la más reciente de las dos. Solo la administradora puede consultarlo.

create or replace function public.admin_login_overview()
returns table (member_id uuid, name text, last_login timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo la administradora puede ver las conexiones.' using errcode = '42501';
  end if;

  return query
  select m.id,
         m.name,
         greatest(
           (select max(a.created_at) from public.activity_log a where a.user_id = m.user_id and a.action = 'LOGIN'),
           (select u.last_sign_in_at from auth.users u where u.id = m.user_id)
         )
    from public.members m
   order by 3 desc nulls last, m.position;
end;
$$;
revoke all on function public.admin_login_overview() from public, anon;
grant execute on function public.admin_login_overview() to authenticated;

-- Mismo disparador de fase completa, con un mensaje sin nombres propios.
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
    raise exception 'Esta fase está completa. La administradora puede reabrirla si falta algo.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.block_closed_phase() from public, anon, authenticated;
