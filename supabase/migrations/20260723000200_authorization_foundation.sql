alter table public.profiles enable row level security;
alter table public.admin_role_audit_logs enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_cases enable row level security;
alter table public.case_media enable row level security;
alter table public.case_videos enable row level security;
alter table public.tags enable row level security;
alter table public.case_tags enable row level security;
alter table public.site_content enable row level security;
alter table public.site_content_versions enable row level security;
alter table public.price_items enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;
grant usage on type public.app_role, public.case_status, public.media_stage, public.upload_status, public.tag_type to authenticated;

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
$$;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_role() in ('admin'::public.app_role, 'super_admin'::public.app_role), false)
$$;

create or replace function private.is_active_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_role() = 'super_admin'::public.app_role, false)
$$;

revoke all on function private.current_role() from public, anon, authenticated;
revoke all on function private.is_active_admin() from public, anon, authenticated;
revoke all on function private.is_active_super_admin() from public, anon, authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_active_admin() to authenticated;
grant execute on function private.is_active_super_admin() to authenticated;

create or replace function private.protect_profile_authorization_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.allow_role_change', true), 'false') <> 'true'
    and (
      new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.email is distinct from old.email
    )
  then
    raise exception using errcode = '42501', message = 'profile_authorization_fields_are_server_managed';
  end if;
  return new;
end;
$$;

create trigger protect_profile_authorization_fields
before update on public.profiles
for each row execute function private.protect_profile_authorization_fields();

create or replace function private.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '42501', message = 'admin_role_audit_logs_are_immutable';
end;
$$;

create trigger admin_role_audit_logs_immutable
before update or delete on public.admin_role_audit_logs
for each row execute function private.reject_audit_mutation();

grant select, update on public.profiles to authenticated;

create policy profiles_self_read
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_self_update
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_super_admin_read
on public.profiles
for select
to authenticated
using ((select private.is_active_super_admin()));

create policy admin_role_audit_logs_super_admin_read
on public.admin_role_audit_logs
for select
to authenticated
using ((select private.is_active_super_admin()));

grant select on public.admin_role_audit_logs to authenticated;
