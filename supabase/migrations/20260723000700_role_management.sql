create or replace function private.require_active_super_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null or not (select private.is_active_super_admin()) then
    raise exception using errcode = '42501', message = 'active_super_admin_required';
  end if;
  return actor_id;
end;
$$;

revoke all on function private.require_active_super_admin() from public, anon, authenticated;
grant execute on function private.require_active_super_admin() to authenticated;

create or replace function public.list_admin_profiles()
returns table (
  id uuid,
  email text,
  display_name text,
  role public.app_role,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_active_super_admin();
  return query
  select p.id, p.email, p.display_name, p.role, p.is_active, p.created_at, p.updated_at
  from public.profiles p
  order by p.created_at desc, p.id;
end;
$$;

create or replace function public.set_user_admin_role(
  target_id uuid,
  new_role public.app_role,
  active boolean,
  reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_super_admin();
  previous public.profiles;
  updated public.profiles;
begin
  if new_role not in ('customer'::public.app_role, 'admin'::public.app_role) then
    raise exception using errcode = '23514', message = 'web_role_change_allows_customer_or_admin_only';
  end if;
  if char_length(trim(coalesce(reason, ''))) < 3 then
    raise exception using errcode = '23514', message = 'role_change_reason_required';
  end if;

  lock table public.profiles in share row exclusive mode;
  select * into previous from public.profiles where id = target_id for update;
  if previous.id is null then raise exception using errcode = 'P0002', message = 'profile_not_found'; end if;

  if previous.role = 'super_admin'::public.app_role
    and previous.is_active = true
    and (new_role <> 'super_admin'::public.app_role or active = false)
    and (select count(*) from public.profiles where role = 'super_admin'::public.app_role and is_active = true) <= 1
  then
    raise exception using errcode = '23514', message = 'last_active_super_admin_protected';
  end if;

  if previous.role = new_role and previous.is_active = active then
    return previous;
  end if;

  perform set_config('app.allow_role_change', 'true', true);
  update public.profiles
  set role = new_role, is_active = active
  where id = target_id
  returning * into updated;

  insert into public.admin_role_audit_logs(
    actor_id,
    target_id,
    previous_role,
    new_role,
    previous_active,
    new_active,
    reason
  ) values (
    actor_id,
    target_id,
    previous.role,
    updated.role,
    previous.is_active,
    updated.is_active,
    trim(reason)
  );

  return updated;
end;
$$;

revoke all on function public.list_admin_profiles() from public, anon;
revoke all on function public.set_user_admin_role(uuid, public.app_role, boolean, text) from public, anon;
grant execute on function public.list_admin_profiles() to authenticated;
grant execute on function public.set_user_admin_role(uuid, public.app_role, boolean, text) to authenticated;
