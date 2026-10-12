-- Ábaco del Tiempo · Lista de cuentas para la administradora
--
-- Los correos viven en auth.users, que la API no expone. Esta función los entrega SOLO a la
-- administradora, para que vea quién tiene cuenta, cuántos cupos quedan y pueda eliminar una.
create or replace function public.admin_list_accounts()
returns table (user_id uuid, email text, role text, member_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo la administradora puede ver las cuentas.' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, p.role, m.name, u.created_at
      from auth.users u
      left join public.profiles p on p.user_id = u.id
      left join public.members m on m.user_id = u.id
     order by u.created_at;
end;
$$;
revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
