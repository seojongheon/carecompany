begin;

select plan(31);

select has_schema('private', 'private helper schema exists');
select has_type('public', 'app_role', 'app_role enum exists');
select has_type('public', 'case_status', 'case_status enum exists');
select has_type('public', 'media_stage', 'media_stage enum exists');
select has_type('public', 'upload_status', 'upload_status enum exists');
select has_type('public', 'tag_type', 'tag_type enum exists');

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'admin_role_audit_logs', 'audit log exists');
select has_table('public', 'services', 'services exists');
select has_table('public', 'portfolio_cases', 'portfolio cases exists');
select has_table('public', 'case_media', 'case media exists');
select has_table('public', 'case_videos', 'case videos exists');
select has_table('public', 'tags', 'tags exists');
select has_table('public', 'case_tags', 'case tags exists');
select has_table('public', 'site_content', 'site content exists');
select has_table('public', 'site_content_versions', 'site content versions exists');
select has_table('public', 'price_items', 'price items exists');

select col_is_pk('public', 'profiles', 'id', 'profile id is primary key');
select col_is_fk('public', 'profiles', 'id', 'profile references auth user');
select col_has_default('public', 'profiles', 'role', 'profile role defaults safely');
select col_has_default('public', 'profiles', 'is_active', 'profile active state has default');
select has_function('private', 'is_active_admin', array[]::text[], 'active admin helper exists');
select has_function('private', 'is_active_super_admin', array[]::text[], 'active super admin helper exists');
select has_function('public', 'handle_new_user', array[]::text[], 'auth profile trigger function exists');

select results_eq(
  $$select key from public.services order by sort_order$$,
  $$values ('bathroom'::text), ('aircon'::text), ('apartment-window'::text), ('commercial-window'::text)$$,
  'four canonical services are present'
);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.portfolio_cases'::regclass), 'portfolio cases RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.site_content'::regclass), 'site content RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.admin_role_audit_logs'::regclass), 'audit RLS enabled');
select isnt_empty(
  $$select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created' and not tgisinternal$$,
  'auth user profile trigger is installed'
);
select is_empty(
  $$select 1 from public.profiles where role <> 'customer'::public.app_role$$,
  'migration never seeds privileged profiles'
);

select * from finish();
rollback;
