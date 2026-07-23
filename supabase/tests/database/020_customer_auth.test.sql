begin;

select plan(10);

select policies_are('public', 'profiles', array['profiles_self_read', 'profiles_self_update', 'profiles_super_admin_read'], 'profile policies are restricted');
select has_trigger('public', 'profiles', 'protect_profile_authorization_fields', 'role fields are protected by trigger');

select is(
  (select column_default from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'),
  '''customer''::app_role',
  'new profiles default to customer'
);
select is(
  (select column_default from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_active'),
  'true',
  'new profiles default active'
);

select ok(not has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anonymous cannot select profiles');
select ok(has_table_privilege('authenticated', 'public.profiles', 'SELECT'), 'authenticated role has policy-gated select');
select ok(has_table_privilege('authenticated', 'public.profiles', 'UPDATE'), 'authenticated role has policy-gated update');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'INSERT'), 'clients cannot insert profiles');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'clients cannot delete profiles');
select function_privs_are('public', 'handle_new_user', array[]::text[], 'public', array[]::text[], 'profile trigger is not client executable');

select * from finish();
rollback;
