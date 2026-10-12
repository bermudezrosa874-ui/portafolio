-- Ábaco del Tiempo · Máximo 6 cuentas, solo con correos autorizados por Rosa
--
-- El registro público de Supabase puede estar abierto; esta regla vive en la base y se aplica
-- igual por la API, la app o cualquier invitación: no se crea una cuenta nueva si
--   1) su correo no está registrado en member_emails (solo Rosa lo escribe), o
--   2) ya existen 6 cuentas.
create or replace function private.limit_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.member_emails where email = lower(new.email)) then
    raise exception 'Este correo no está autorizado para crear una cuenta.' using errcode = '42501';
  end if;
  if (select count(*) from auth.users) >= 6 then
    raise exception 'Se alcanzó el máximo de 6 cuentas del portafolio.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_accounts() from public, anon, authenticated;

create trigger a_limit_accounts
  before insert on auth.users
  for each row execute function private.limit_accounts();
