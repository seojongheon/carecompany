# Supabase operations

## Applied database boundary

The seven versioned migrations create the content schema, customer profile trigger, RLS policies, trusted publish functions, immutable role audit, and super-admin role-management RPC. They never create an Auth user or privileged profile.

## Initial super administrator (deferred, do not execute during build)

1. Let the intended owner create a normal customer account through Supabase Auth.
2. Verify the account email and copy its `auth.users.id` UUID through an authenticated operations channel.
3. Replace both placeholders below during a reviewed SQL session. Do not save the resolved SQL or password in source control.
4. Execute as the database owner, confirm exactly one profile and one audit row changed, then sign out all existing sessions for that user.

```sql
begin;
lock table public.profiles in share row exclusive mode;
select set_config('app.allow_role_change', 'true', true);

with previous as (
  select * from public.profiles where id = '<VERIFIED_USER_UUID>'::uuid for update
), updated as (
  update public.profiles
  set role = 'super_admin'::public.app_role, is_active = true
  where id = '<VERIFIED_USER_UUID>'::uuid
  returning *
)
insert into public.admin_role_audit_logs (
  actor_id, target_id, previous_role, new_role,
  previous_active, new_active, reason
)
select null, updated.id, previous.role, updated.role,
       previous.is_active, updated.is_active,
       'Initial super administrator approved by operations'
from previous join updated on previous.id = updated.id;

commit;
```

If the target profile is missing or the audit insert count is not exactly one, roll back and investigate. The web role-management RPC intentionally cannot create another `super_admin`.

## Remote safety

- Always run `migration list` and `db push --dry-run` before push.
- Never run `db reset --linked` or `--include-seed` against the linked project.
- Keep `SUPABASE_DATABASE_PASSWORD` local and rotate it after any suspected terminal/log exposure.
- Do not run `storage/enable-storage.sql` until its activation checklist is approved.
