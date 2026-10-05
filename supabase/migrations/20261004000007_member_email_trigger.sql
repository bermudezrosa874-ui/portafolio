-- Ábaco del Tiempo · Enlace automático al registrar el correo de un integrante
--
-- Hasta ahora una cuenta se enlazaba con su ficha solo al CREARSE (trigger sobre auth.users).
-- Si la administradora invitaba a alguien antes de registrar su correo, la cuenta quedaba sin
-- enlazar. Ahora también se enlaza cuando se guarda el correo en member_emails.

-- Una ficha por cuenta (members.user_id es único): si la cuenta estaba enlazada a otra ficha,
-- se libera antes de enlazarla a la nueva.
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
    update public.members set user_id = null where user_id = p_user_id and id <> v_member_id;
    update public.members set user_id = p_user_id where id = v_member_id;
  end if;
end;
$$;
revoke all on function private.link_user(uuid, text) from public, anon, authenticated;

create or replace function private.handle_member_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = new.email limit 1;
  if v_user_id is not null then
    perform private.link_user(v_user_id, new.email);
  end if;
  return new;
end;
$$;
revoke all on function private.handle_member_email() from public, anon, authenticated;

create trigger on_member_email_saved
  after insert or update on public.member_emails
  for each row execute function private.handle_member_email();
