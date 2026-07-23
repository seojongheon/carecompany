begin;

select plan(18);

select has_function('public', 'publish_case', array['uuid'], 'publish case RPC exists');
select has_function('public', 'unpublish_case', array['uuid'], 'unpublish case RPC exists');
select has_function('public', 'soft_delete_case', array['uuid'], 'soft delete RPC exists');
select has_function('public', 'update_site_content_draft', array['jsonb'], 'site draft RPC exists');
select has_function('public', 'publish_site_content', array[]::text[], 'site publish RPC exists');
select has_function('public', 'restore_site_content_version', array['uuid'], 'site restore RPC exists');

select has_trigger('public', 'case_media', 'limit_case_media_count', '69-media trigger exists');
select has_trigger('public', 'case_videos', 'limit_case_video_count', 'three-video trigger exists');
select has_trigger('public', 'case_tags', 'enforce_case_tag_service', 'case/tag service trigger exists');
select has_index('public', 'case_media', 'case_media_one_cover_per_case', 'one cover index exists');

select function_returns('public', 'publish_case', array['uuid'], 'portfolio_cases', 'publish returns case');
select function_returns('public', 'unpublish_case', array['uuid'], 'portfolio_cases', 'unpublish returns case');
select function_returns('public', 'soft_delete_case', array['uuid'], 'portfolio_cases', 'soft delete returns case');
select function_returns('public', 'publish_site_content', array[]::text[], 'jsonb', 'site publish returns content');

select function_privs_are('public', 'publish_case', array['uuid'], 'anon', array[]::text[], 'anonymous cannot publish cases');
select function_privs_are('public', 'publish_case', array['uuid'], 'authenticated', array['EXECUTE'], 'authenticated role is checked inside publish RPC');
select function_privs_are('public', 'publish_site_content', array[]::text[], 'anon', array[]::text[], 'anonymous cannot publish site content');
select ok((select relrowsecurity from pg_class where oid = 'public.site_content_versions'::regclass), 'site versions RLS enabled');

select * from finish();
rollback;
