begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

select results_eq(
  $$select public, file_size_limit from storage.buckets where id = 'case-originals'$$,
  $$values (false, 20971520::bigint)$$,
  'case originals remain private and limited to 20 MiB'
);
select results_eq(
  $$select public, file_size_limit from storage.buckets where id = 'case-reviewed-public'$$,
  $$values (false, 20971520::bigint)$$,
  'case reviewed copies remain private and limited to 20 MiB'
);
select results_eq(
  $$select public, file_size_limit from storage.buckets where id = 'landing-hero'$$,
  $$values (false, 20971520::bigint)$$,
  'landing hero bucket is private and limited to 20 MiB'
);
select results_eq(
  $$select allowed_mime_types from storage.buckets where id = 'case-reviewed-public'$$,
  $$values (array['image/webp']::text[])$$,
  'case reviewed bucket accepts only WebP'
);
select results_eq(
  $$select allowed_mime_types from storage.buckets where id = 'case-originals'$$,
  $$values (array['image/jpeg', 'image/png', 'image/webp']::text[])$$,
  'case originals accept only formats with a supported signature validator'
);
select results_eq(
  $$select allowed_mime_types from storage.buckets where id = 'landing-hero'$$,
  $$values (array['image/webp']::text[])$$,
  'landing hero bucket accepts only WebP'
);

select policies_are(
  'storage',
  'objects',
  array[
    'case_originals_admin_delete',
    'case_originals_admin_insert',
    'case_originals_admin_select',
    'case_originals_admin_update',
    'case_reviewed_admin_delete',
    'case_reviewed_admin_insert',
    'case_reviewed_admin_select',
    'case_reviewed_admin_update',
    'case_reviewed_public_read',
    'landing_hero_admin_delete',
    'landing_hero_admin_insert',
    'landing_hero_admin_select',
    'landing_hero_admin_update',
    'landing_hero_public_read'
  ],
  'Storage object policies are explicit'
);

select has_function('public', 'is_landing_hero_referenced', array['text'], 'hero reference check exists');
select function_returns('public', 'is_landing_hero_referenced', array['text'], 'boolean', 'hero reference check returns boolean');
select function_privs_are('public', 'is_landing_hero_referenced', array['text'], 'anon', array[]::text[], 'anonymous cannot inspect hero references');
select function_privs_are('public', 'is_landing_hero_referenced', array['text'], 'authenticated', array['EXECUTE'], 'authenticated role is checked inside hero reference RPC');
select has_function('private', 'landing_hero_is_published', array['text'], 'published hero policy helper exists');
select function_privs_are('private', 'landing_hero_is_published', array['text'], 'anon', array['EXECUTE'], 'anonymous policy can check only the published hero path');
select has_function('public', 'replace_case_media', array['uuid', 'jsonb'], 'transactional media replacement RPC exists');
select function_returns('public', 'replace_case_media', array['uuid', 'jsonb'], 'void', 'media replacement RPC returns void');
select function_privs_are('public', 'replace_case_media', array['uuid', 'jsonb'], 'anon', array[]::text[], 'anonymous cannot replace case media');
select has_function('public', 'claim_landing_hero_cleanup', array['text'], 'atomic hero cleanup claim exists');
select function_returns('public', 'claim_landing_hero_cleanup', array['text'], 'boolean', 'hero cleanup claim reports whether deletion is safe');
select function_privs_are('public', 'claim_landing_hero_cleanup', array['text'], 'anon', array[]::text[], 'anonymous cannot claim hero cleanup');
select has_function('public', 'finish_landing_hero_cleanup', array['text'], 'hero cleanup completion RPC exists');
select has_trigger('public', 'site_content', 'reject_tombstoned_landing_hero', 'tombstoned hero paths cannot be re-referenced');
select has_function('public', 'list_pending_landing_hero_cleanup', array[]::text[], 'pending hero cleanup retry RPC exists');

select ok(
  exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'case_reviewed_public_read' and roles @> array['anon']::name[]),
  'anonymous case reviewed reads are policy gated'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'landing_hero_public_read' and roles @> array['anon']::name[]),
  'anonymous landing hero reads are policy gated'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'case_originals_admin_insert' and roles @> array['authenticated']::name[]),
  'case original uploads require authenticated policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'landing_hero_admin_insert' and roles @> array['authenticated']::name[]),
  'landing hero uploads require authenticated policy'
);

set local role anon;
select throws_ok(
  $$insert into storage.buckets (id, name) values ('tap-anon-bucket', 'tap-anon-bucket')$$,
  '42501',
  null,
  'anonymous cannot create buckets'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('landing-hero', 'tap-anon.webp')$$,
  '42501',
  null,
  'anonymous cannot upload objects'
);
reset role;

set local role authenticated;
select throws_ok(
  $$insert into storage.buckets (id, name) values ('tap-authenticated-bucket', 'tap-authenticated-bucket')$$,
  '42501',
  null,
  'authenticated users cannot create buckets'
);
reset role;

select ok(
  (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass),
  'authenticated uploads are restricted by RLS'
);

insert into public.portfolio_cases (
  id, service_id, slug, title, status, published_at
) values
  ('51000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'storage-public-case', 'Storage public case', 'private', null),
  ('51000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'storage-private-case', 'Storage private case', 'private', null);

insert into public.case_media (
  id, case_id, stage, is_public, alt_text, width, height, mime_type, size_bytes, upload_status, storage_path
) values
  ('52000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'after', true, 'public', 1, 1, 'image/webp', 1, 'ready', '51000000-0000-4000-8000-000000000001/public.webp'),
  ('52000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000002', 'after', true, 'private', 1, 1, 'image/webp', 1, 'ready', '51000000-0000-4000-8000-000000000002/private.webp');

set local app.allow_case_transition = 'true';
update public.portfolio_cases
set status = 'published', published_at = now()
where id = '51000000-0000-4000-8000-000000000001';
set local app.allow_case_transition = 'false';

update public.site_content
set published = jsonb_set(published, '{home,heroImageStoragePath}', '"hero/published.webp"'::jsonb, true)
where id = true;

insert into storage.objects (bucket_id, name) values
  ('case-originals', '51000000-0000-4000-8000-000000000001/original.jpg'),
  ('case-reviewed-public', '51000000-0000-4000-8000-000000000001/public.webp'),
  ('case-reviewed-public', '51000000-0000-4000-8000-000000000002/private.webp'),
  ('landing-hero', 'hero/published.webp'),
  ('landing-hero', 'hero/draft-only.webp');

set local role anon;

select results_eq(
  $$
    select name
    from storage.objects
    where bucket_id = 'case-reviewed-public'
      and name in (
        '51000000-0000-4000-8000-000000000001/public.webp',
        '51000000-0000-4000-8000-000000000002/private.webp'
      )
    order by name
  $$,
  $$values ('51000000-0000-4000-8000-000000000001/public.webp'::text)$$,
  'anonymous reads only reviewed media attached to a published case'
);
select is_empty(
  $$select name from storage.objects where bucket_id = 'case-originals'$$,
  'anonymous cannot read case originals'
);
select results_eq(
  $$select name from storage.objects where bucket_id = 'landing-hero' order by name$$,
  $$values ('hero/published.webp'::text)$$,
  'anonymous reads only the currently published landing hero'
);
select throws_ok(
  $$select public.is_landing_hero_referenced('hero/published.webp')$$,
  '42501',
  null,
  'anonymous cannot inspect draft and version references'
);

reset role;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '53000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'storage-admin@example.com', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '53000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'storage-customer@example.com', '', '{}'::jsonb, '{}'::jsonb, now(), now());
set local app.allow_role_change = 'true';
update public.profiles set role = 'admin', is_active = true where id = '53000000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub', '53000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('case-originals', '51000000-0000-4000-8000-000000000002/admin.jpg')$$,
  'active administrator can upload into an existing private case folder'
);
reset role;

select set_config('request.jwt.claim.sub', '53000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('case-originals', '51000000-0000-4000-8000-000000000002/customer.jpg')$$,
  '42501',
  null,
  'customer cannot upload case originals'
);
reset role;

select set_config('request.jwt.claim.sub', '53000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select throws_ok(
  $$select public.replace_case_media(
    '51000000-0000-4000-8000-000000000002',
    '[{"stage":"after","sort_order":0,"is_cover":false,"is_public":false,"alt_text":"invalid","caption":"","width":0,"height":1,"mime_type":"image/webp","size_bytes":1,"upload_status":"ready","mock_asset_key":"bathroom"}]'::jsonb
  )$$,
  '23514',
  null,
  'invalid replacement rolls back the transactional media mutation'
);
reset role;
select is(
  (select count(*) from public.case_media where case_id = '51000000-0000-4000-8000-000000000002'),
  1::bigint,
  'failed transactional replacement preserves existing media references'
);

select * from finish();
rollback;
