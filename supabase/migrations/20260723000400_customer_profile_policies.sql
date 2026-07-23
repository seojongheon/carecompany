create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    perform set_config('app.allow_role_change', 'true', true);
    update public.profiles
    set email = lower(trim(coalesce(new.email, '')))
    where id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_user_email() from public, anon, authenticated;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_user_email();

revoke insert, delete on public.profiles from authenticated;
