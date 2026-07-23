begin;

select plan(16);

select has_function('public', 'get_published_site_content', array[]::text[], 'published site content RPC exists');
select has_function('public', 'list_public_portfolio_cases', array['text', 'text[]', 'integer', 'timestamptz', 'uuid'], 'public portfolio list RPC exists');
select has_function('public', 'get_public_portfolio_case', array['text'], 'public portfolio detail RPC exists');

select policies_are('public', 'services', array['services_public_read', 'services_admin_all'], 'service policies are explicit');
select policies_are('public', 'portfolio_cases', array['portfolio_cases_public_read', 'portfolio_cases_admin_all'], 'case policies are explicit');
select policies_are('public', 'case_media', array['case_media_public_read', 'case_media_admin_all'], 'media policies are explicit');
select policies_are('public', 'case_videos', array['case_videos_public_read', 'case_videos_admin_all'], 'video policies are explicit');
select policies_are('public', 'tags', array['tags_public_read', 'tags_admin_all'], 'tag policies are explicit');
select policies_are('public', 'case_tags', array['case_tags_public_read', 'case_tags_admin_all'], 'case-tag policies are explicit');
select policies_are('public', 'price_items', array['price_items_public_read', 'price_items_admin_all'], 'price policies are explicit');

select is_empty(
  $$select 1 from information_schema.role_table_grants where table_schema = 'public' and table_name = 'site_content' and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'$$,
  'draft-bearing site_content has no direct select grant'
);
select function_privs_are('public', 'get_published_site_content', array[]::text[], 'anon', array['EXECUTE'], 'anon can call published content RPC');
select function_privs_are('public', 'get_published_site_content', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated can call published content RPC');

select lives_ok($$set local role anon$$, 'anon role can be assumed');
select lives_ok($$select public.get_published_site_content()$$, 'anon can read only published site content');
select throws_ok($$select draft from public.site_content$$, '42501', null, 'anon cannot select draft directly');

select * from finish();
rollback;
