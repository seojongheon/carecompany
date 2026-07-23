begin;

select plan(13);

select has_function('public', 'list_admin_profiles', array[]::text[], 'super-admin list RPC exists');
select has_function('public', 'set_user_admin_role', array['uuid', 'app_role', 'boolean', 'text'], 'role mutation RPC exists');
select function_privs_are('public', 'list_admin_profiles', array[]::text[], 'anon', array[]::text[], 'anon cannot list profiles');
select function_privs_are('public', 'set_user_admin_role', array['uuid', 'app_role', 'boolean', 'text'], 'anon', array[]::text[], 'anon cannot change roles');
select function_privs_are('public', 'set_user_admin_role', array['uuid', 'app_role', 'boolean', 'text'], 'authenticated', array['EXECUTE'], 'authenticated role is checked inside role RPC');

select ok((select prosecdef from pg_proc where oid = 'public.set_user_admin_role(uuid,public.app_role,boolean,text)'::regprocedure), 'role mutation is security definer');
select is((select proconfig[1] from pg_proc where oid = 'public.set_user_admin_role(uuid,public.app_role,boolean,text)'::regprocedure), 'search_path=""', 'role mutation fixes search path');
select ok((select relrowsecurity from pg_class where oid = 'public.admin_role_audit_logs'::regclass), 'audit log uses RLS');
select ok(not has_table_privilege('authenticated', 'public.admin_role_audit_logs', 'INSERT'), 'clients cannot insert audit rows');
select ok(not has_table_privilege('authenticated', 'public.admin_role_audit_logs', 'UPDATE'), 'clients cannot update audit rows');
select ok(not has_table_privilege('authenticated', 'public.admin_role_audit_logs', 'DELETE'), 'clients cannot delete audit rows');
select has_trigger('public', 'admin_role_audit_logs', 'admin_role_audit_logs_immutable', 'audit rows are immutable');
select is_empty($$select 1 from public.profiles where role = 'super_admin'::public.app_role$$, 'no super administrator is seeded');

select * from finish();
rollback;
