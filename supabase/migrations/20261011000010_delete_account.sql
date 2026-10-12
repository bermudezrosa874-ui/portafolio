-- Ábaco del Tiempo · Eliminar una cuenta (decisión de la administradora)
--
-- Al eliminar una cuenta se conservan sus aportes (quedan con el nombre de quien los subió),
-- se retira la autorización de su correo y se libera su cupo de las 6 cuentas.

-- Los aportes ya no impiden borrar la cuenta: pierden el vínculo pero conservan el nombre.
alter table public.contributions alter column uploaded_by drop not null;
alter table public.contributions drop constraint if exists contributions_uploaded_by_fkey;
alter table public.contributions
  add constraint contributions_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users (id) on delete set null;

-- La acción «SET NULL» de la llave foránea también pasa por este disparador: se le permite
-- soltar el vínculo, pero nunca reasignar el aporte a otra persona.
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
    if new.uploaded_by is not null then new.uploaded_by := old.uploaded_by; end if;
    new.uploaded_by_name := old.uploaded_by_name;
    new.created_at := old.created_at;
    -- Un colaborador que edita su aporte lo devuelve a revisión: nunca se publica solo.
    if not v_admin and (select auth.uid()) is not null then
      new.status := case when new.status = 'draft' then 'draft' else 'pending_review' end;
    end if;
  end if;
  new.published := (new.status = 'published');
  return new;
end;
$$;
revoke all on function private.contribution_guard() from public, anon, authenticated;

create or replace function public.admin_delete_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if not private.is_admin() then
    raise exception 'Solo la administradora puede eliminar cuentas.' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'No puedes eliminar tu propia cuenta.' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where user_id = p_user_id and role = 'admin') then
    raise exception 'No se puede eliminar a la administradora del portafolio.' using errcode = '42501';
  end if;
  select lower(email) into v_email from auth.users where id = p_user_id;
  if v_email is null then
    raise exception 'La cuenta no existe.';
  end if;
  -- Sin autorización del correo, la persona no puede volver a registrarse.
  delete from public.member_emails where email = v_email;
  delete from auth.users where id = p_user_id;
end;
$$;
revoke all on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_delete_account(uuid) to authenticated;
