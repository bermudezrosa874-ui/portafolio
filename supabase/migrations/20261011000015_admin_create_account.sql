-- Ábaco del Tiempo · Rosa crea la cuenta de un compañero (correo y contraseña a su elección)
--
-- Solo la administradora puede ejecutarla. La cuenta nace con el correo ya confirmado (no hace falta abrir
-- ningún enlace), con rol colaborador y enlazada a la ficha elegida. Respeta el máximo de 6 cuentas.
-- La contraseña se guarda cifrada (bcrypt) por la propia base; nunca se registra en ninguna tabla de actividad.
create or replace function public.admin_create_account(p_member_id uuid, p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_id    uuid := gen_random_uuid();
begin
  if not private.is_admin() then
    raise exception 'Solo la administradora puede crear cuentas.' using errcode = '42501';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'El correo no parece válido.';
  end if;
  if p_password is null or char_length(p_password) < 10 or char_length(p_password) > 72 then
    raise exception 'La contraseña debe tener entre 10 y 72 caracteres.';
  end if;
  if not exists (select 1 from public.members where id = p_member_id) then
    raise exception 'La ficha del integrante no existe.';
  end if;
  if exists (select 1 from public.members where id = p_member_id and user_id is not null) then
    raise exception 'Esa ficha ya tiene una cuenta.';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Ya existe una cuenta con ese correo.';
  end if;
  if (select count(*) from auth.users) >= 6 then
    raise exception 'Se alcanzó el máximo de 6 cuentas del portafolio.';
  end if;

  -- El correo queda autorizado y asociado a la ficha (el disparador de registro lo enlaza al crear la cuenta).
  insert into public.member_emails (email, member_id)
  values (v_email, p_member_id)
  on conflict (email) do update set member_id = excluded.member_id;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    reauthentication_token, phone_change, phone_change_token, email_change_confirm_status,
    is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
    '', '', '', '', '', '', '', '', 0,
    false, false
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;
revoke all on function public.admin_create_account(uuid, text, text) from public, anon;
grant execute on function public.admin_create_account(uuid, text, text) to authenticated;
