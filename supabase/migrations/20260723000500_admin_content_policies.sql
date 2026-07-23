revoke delete on public.services, public.portfolio_cases from authenticated;

create or replace function private.lock_case_collection(case_id uuid)
returns void
language sql
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended(case_id::text, 7269))
$$;

create or replace function private.enforce_case_media_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.lock_case_collection(new.case_id);
  if (select count(*) from public.case_media where case_id = new.case_id and id <> new.id) >= 69 then
    raise exception using errcode = '23514', message = 'case_media_limit_exceeded';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_case_video_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.lock_case_collection(new.case_id);
  if (select count(*) from public.case_videos where case_id = new.case_id and id <> new.id) >= 3 then
    raise exception using errcode = '23514', message = 'case_video_limit_exceeded';
  end if;
  return new;
end;
$$;

create or replace function private.protect_case_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.allow_case_transition', true), 'false') <> 'true'
    and (new.status is distinct from old.status or new.published_at is distinct from old.published_at)
  then
    raise exception using errcode = '42501', message = 'case_status_requires_trusted_operation';
  end if;
  return new;
end;
$$;

create trigger protect_case_status_transition
before update on public.portfolio_cases
for each row execute function private.protect_case_transition();

create or replace function private.prevent_published_case_asset_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  affected_case_id uuid := coalesce(new.case_id, old.case_id);
begin
  if coalesce(current_setting('app.allow_published_asset_change', true), 'false') <> 'true'
    and exists (
      select 1 from public.portfolio_cases c
      where c.id = affected_case_id and c.status = 'published'::public.case_status
    )
  then
    raise exception using errcode = '42501', message = 'unpublish_case_before_asset_change';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_published_case_media
before insert or update or delete on public.case_media
for each row execute function private.prevent_published_case_asset_mutation();

create trigger protect_published_case_videos
before insert or update or delete on public.case_videos
for each row execute function private.prevent_published_case_asset_mutation();

create trigger protect_published_case_tags
before insert or update or delete on public.case_tags
for each row execute function private.prevent_published_case_asset_mutation();

create or replace function private.require_active_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null or not (select private.is_active_admin()) then
    raise exception using errcode = '42501', message = 'active_admin_required';
  end if;
  return actor_id;
end;
$$;

revoke all on function private.require_active_admin() from public, anon, authenticated;
grant execute on function private.require_active_admin() to authenticated;

create or replace function public.publish_case(case_id uuid)
returns public.portfolio_cases
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
  target public.portfolio_cases;
  required_privacy_keys constant text[] := array[
    'noIdentifiablePeople',
    'noVehiclePlates',
    'noDetailedAddressOrContact',
    'noPrivateDocumentsOrBelongings',
    'publicMediaReviewed'
  ];
begin
  select * into target from public.portfolio_cases where id = case_id for update;
  if target.id is null then raise exception using errcode = 'P0002', message = 'case_not_found'; end if;
  if target.status = 'deleted'::public.case_status then raise exception using errcode = '23514', message = 'deleted_case_cannot_publish'; end if;
  if char_length(trim(target.title)) = 0 then raise exception using errcode = '23514', message = 'missing_title'; end if;
  if char_length(trim(target.location_display)) = 0 then raise exception using errcode = '23514', message = 'missing_location'; end if;
  if exists (
    select 1 from unnest(required_privacy_keys) required(key)
    where coalesce((target.privacy_checklist ->> required.key)::boolean, false) = false
  ) then
    raise exception using errcode = '23514', message = 'privacy_checklist_incomplete';
  end if;
  if not exists (
    select 1 from public.case_media m
    where m.case_id = target.id and m.is_cover and m.is_public and m.upload_status = 'ready'::public.upload_status
  ) then
    raise exception using errcode = '23514', message = 'public_ready_cover_required';
  end if;
  if exists (
    select 1 from public.case_media m
    where m.case_id = target.id and m.is_public and (m.upload_status <> 'ready'::public.upload_status or char_length(trim(m.alt_text)) = 0)
  ) then
    raise exception using errcode = '23514', message = 'public_media_not_ready';
  end if;

  perform set_config('app.allow_case_transition', 'true', true);
  update public.portfolio_cases
  set status = 'published'::public.case_status,
      published_at = now(),
      updated_by = actor_id,
      privacy_checklist = target.privacy_checklist || jsonb_build_object(
        'requiredMetadataComplete', true,
        'hasPublicReadyMedia', true
      )
  where id = target.id
  returning * into target;
  return target;
end;
$$;

create or replace function public.unpublish_case(case_id uuid)
returns public.portfolio_cases
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
  target public.portfolio_cases;
begin
  perform 1 from public.portfolio_cases where id = case_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'case_not_found'; end if;
  perform set_config('app.allow_case_transition', 'true', true);
  update public.portfolio_cases
  set status = 'private'::public.case_status, published_at = null, updated_by = actor_id
  where id = case_id and status <> 'deleted'::public.case_status
  returning * into target;
  if target.id is null then raise exception using errcode = '23514', message = 'deleted_case_cannot_unpublish'; end if;
  return target;
end;
$$;

create or replace function public.soft_delete_case(case_id uuid)
returns public.portfolio_cases
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
  target public.portfolio_cases;
begin
  perform 1 from public.portfolio_cases where id = case_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'case_not_found'; end if;
  perform set_config('app.allow_case_transition', 'true', true);
  update public.portfolio_cases
  set status = 'deleted'::public.case_status, published_at = null, updated_by = actor_id
  where id = case_id
  returning * into target;
  return target;
end;
$$;

revoke all on function public.publish_case(uuid) from public, anon;
revoke all on function public.unpublish_case(uuid) from public, anon;
revoke all on function public.soft_delete_case(uuid) from public, anon;
grant execute on function public.publish_case(uuid) to authenticated;
grant execute on function public.unpublish_case(uuid) to authenticated;
grant execute on function public.soft_delete_case(uuid) to authenticated;
