-- Production-ready private image storage for case media and the landing hero.
-- Client operations remain gated by NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'case-originals',
    'case-originals',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'case-reviewed-public',
    'case-reviewed-public',
    false,
    20971520,
    array['image/webp']
  ),
  (
    'landing-hero',
    'landing-hero',
    false,
    20971520,
    array['image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "case_originals_admin_select" on storage.objects;
drop policy if exists "case_originals_admin_insert" on storage.objects;
drop policy if exists "case_originals_admin_update" on storage.objects;
drop policy if exists "case_originals_admin_delete" on storage.objects;
drop policy if exists "case_reviewed_public_read" on storage.objects;
drop policy if exists "case_reviewed_admin_select" on storage.objects;
drop policy if exists "case_reviewed_admin_insert" on storage.objects;
drop policy if exists "case_reviewed_admin_update" on storage.objects;
drop policy if exists "case_reviewed_admin_delete" on storage.objects;
drop policy if exists "landing_hero_public_read" on storage.objects;
drop policy if exists "landing_hero_admin_select" on storage.objects;
drop policy if exists "landing_hero_admin_insert" on storage.objects;
drop policy if exists "landing_hero_admin_update" on storage.objects;
drop policy if exists "landing_hero_admin_delete" on storage.objects;

create policy "case_originals_admin_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'case-originals'
  and (select private.is_active_admin())
);

create policy "case_originals_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'case-originals'
  and (select private.is_active_admin())
  and exists (
    select 1 from public.portfolio_cases c
    where c.id::text = (storage.foldername(name))[1]
      and c.status <> 'deleted'::public.case_status
  )
);

create policy "case_originals_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'case-originals'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'case-originals'
  and (select private.is_active_admin())
  and exists (
    select 1 from public.portfolio_cases c
    where c.id::text = (storage.foldername(name))[1]
      and c.status <> 'deleted'::public.case_status
  )
);

create policy "case_originals_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'case-originals'
  and (select private.is_active_admin())
);

create policy "case_reviewed_admin_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'case-reviewed-public'
  and (select private.is_active_admin())
);

create policy "case_reviewed_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'case-reviewed-public'
  and storage.extension(name) = 'webp'
  and (select private.is_active_admin())
  and exists (
    select 1 from public.portfolio_cases c
    where c.id::text = (storage.foldername(name))[1]
      and c.status <> 'deleted'::public.case_status
  )
);

create policy "case_reviewed_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'case-reviewed-public'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'case-reviewed-public'
  and storage.extension(name) = 'webp'
  and (select private.is_active_admin())
  and exists (
    select 1 from public.portfolio_cases c
    where c.id::text = (storage.foldername(name))[1]
      and c.status <> 'deleted'::public.case_status
  )
);

create policy "case_reviewed_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'case-reviewed-public'
  and (select private.is_active_admin())
);

create policy "case_reviewed_public_read"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'case-reviewed-public'
  and exists (
    select 1
    from public.case_media m
    where m.storage_path = name
      and m.is_public = true
      and m.upload_status = 'ready'::public.upload_status
      and (select private.case_is_published(m.case_id))
  )
);

create policy "landing_hero_admin_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'landing-hero'
  and (select private.is_active_admin())
);

create policy "landing_hero_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'landing-hero'
  and (storage.foldername(name))[1] = 'hero'
  and storage.extension(name) = 'webp'
  and (select private.is_active_admin())
);

create policy "landing_hero_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'landing-hero'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'landing-hero'
  and (storage.foldername(name))[1] = 'hero'
  and storage.extension(name) = 'webp'
  and (select private.is_active_admin())
);

create policy "landing_hero_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'landing-hero'
  and (select private.is_active_admin())
);

create or replace function private.landing_hero_is_published(candidate_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_content s
    where s.id = true
      and s.published #>> '{home,heroImageStoragePath}' = candidate_path
  )
$$;

revoke all on function private.landing_hero_is_published(text) from public;
grant execute on function private.landing_hero_is_published(text) to anon, authenticated;

create policy "landing_hero_public_read"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'landing-hero'
  and (select private.landing_hero_is_published(name))
);

create or replace function public.is_landing_hero_referenced(storage_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_active_admin();
  return exists (
    select 1
    from public.site_content s
    where s.id = true
      and (
        s.draft #>> '{home,heroImageStoragePath}' = storage_path
        or s.published #>> '{home,heroImageStoragePath}' = storage_path
      )
  ) or exists (
    select 1
    from public.site_content_versions v
    where v.content #>> '{home,heroImageStoragePath}' = storage_path
  );
end;
$$;

revoke all on function public.is_landing_hero_referenced(text) from public, anon;
grant execute on function public.is_landing_hero_referenced(text) to authenticated;

create table if not exists private.landing_hero_cleanup_jobs (
  storage_path text primary key,
  requested_by uuid references public.profiles(id) on delete set null,
  attempts integer not null default 1 check (attempts > 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create or replace function private.reject_tombstoned_landing_hero()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from private.landing_hero_cleanup_jobs j
    where j.storage_path in (
      new.draft #>> '{home,heroImageStoragePath}',
      new.published #>> '{home,heroImageStoragePath}'
    )
  ) then
    raise exception using errcode = '23514', message = 'landing_hero_path_was_cleaned';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_tombstoned_landing_hero on public.site_content;
create trigger reject_tombstoned_landing_hero
before update of draft, published on public.site_content
for each row execute function private.reject_tombstoned_landing_hero();

create or replace function public.claim_landing_hero_cleanup(storage_path text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
begin
  -- Serialize with draft save, publish, and restore operations on the singleton.
  perform 1 from public.site_content where id = true for update;
  if exists (
    select 1 from public.site_content s
    where s.id = true and (
      s.draft #>> '{home,heroImageStoragePath}' = claim_landing_hero_cleanup.storage_path
      or s.published #>> '{home,heroImageStoragePath}' = claim_landing_hero_cleanup.storage_path
    )
  ) or exists (
    select 1 from public.site_content_versions v
    where v.content #>> '{home,heroImageStoragePath}' = claim_landing_hero_cleanup.storage_path
  ) then
    return false;
  end if;
  insert into private.landing_hero_cleanup_jobs (storage_path, requested_by)
  values (claim_landing_hero_cleanup.storage_path, actor_id)
  on conflict (storage_path) do update set attempts = landing_hero_cleanup_jobs.attempts + 1;
  return true;
end;
$$;

create or replace function public.finish_landing_hero_cleanup(storage_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_active_admin();
  update private.landing_hero_cleanup_jobs as job
  set completed_at = now()
  where job.storage_path = finish_landing_hero_cleanup.storage_path;
end;
$$;

create or replace function public.list_pending_landing_hero_cleanup()
returns setof text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_active_admin();
  return query
    select job.storage_path
    from private.landing_hero_cleanup_jobs job
    where job.completed_at is null
    order by job.created_at, job.storage_path;
end;
$$;

revoke all on function public.claim_landing_hero_cleanup(text) from public, anon;
revoke all on function public.finish_landing_hero_cleanup(text) from public, anon;
revoke all on function public.list_pending_landing_hero_cleanup() from public, anon;
grant execute on function public.claim_landing_hero_cleanup(text) to authenticated;
grant execute on function public.finish_landing_hero_cleanup(text) to authenticated;
grant execute on function public.list_pending_landing_hero_cleanup() to authenticated;

-- Replacing a case's media must be one database transaction. The previous
-- browser-side delete/insert pair could commit the delete before an insert
-- failure and remove every live reference for the case.
create or replace function public.replace_case_media(case_id uuid, media jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_active_admin();
  if jsonb_typeof(media) <> 'array' then
    raise exception using errcode = '22023', message = 'case_media_must_be_array';
  end if;
  if not exists (
    select 1 from public.portfolio_cases c
    where c.id = replace_case_media.case_id
      and c.status <> 'deleted'::public.case_status
  ) then
    raise exception using errcode = 'P0002', message = 'case_not_found';
  end if;

  delete from public.case_media m where m.case_id = replace_case_media.case_id;

  insert into public.case_media (
    id, case_id, stage, sort_order, is_cover, is_public, alt_text, caption,
    width, height, mime_type, size_bytes, upload_status, mock_asset_key,
    storage_path, original_storage_path
  )
  select
    coalesce(nullif(item ->> 'id', '')::uuid, gen_random_uuid()),
    replace_case_media.case_id,
    (item ->> 'stage')::public.media_stage,
    (item ->> 'sort_order')::integer,
    coalesce((item ->> 'is_cover')::boolean, false),
    coalesce((item ->> 'is_public')::boolean, false),
    coalesce(item ->> 'alt_text', ''),
    coalesce(item ->> 'caption', ''),
    (item ->> 'width')::integer,
    (item ->> 'height')::integer,
    item ->> 'mime_type',
    (item ->> 'size_bytes')::bigint,
    (item ->> 'upload_status')::public.upload_status,
    nullif(item ->> 'mock_asset_key', ''),
    nullif(item ->> 'storage_path', ''),
    nullif(item ->> 'original_storage_path', '')
  from jsonb_array_elements(media) as item;
end;
$$;

revoke all on function public.replace_case_media(uuid, jsonb) from public, anon;
grant execute on function public.replace_case_media(uuid, jsonb) to authenticated;

commit;
