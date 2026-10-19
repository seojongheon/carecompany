-- Existing tables are the public projection. Drafts/history never have public read policies.
alter table public.portfolio_cases add column revision bigint not null default 0;
create table public.case_revision_drafts (
  case_id uuid primary key references public.portfolio_cases(id) on delete restrict,
  revision bigint not null,
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
create table public.case_revision_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portfolio_cases(id) on delete restrict,
  revision bigint not null,
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object'),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  unique(case_id,revision)
);
alter table public.case_revision_drafts enable row level security;
alter table public.case_revision_history enable row level security;
grant select on public.case_revision_drafts, public.case_revision_history to authenticated;
create policy case_drafts_staff_read on public.case_revision_drafts for select to authenticated using (private.is_active_admin());
create policy case_history_staff_read on public.case_revision_history for select to authenticated using (private.is_active_admin());
create index case_revision_history_recent on public.case_revision_history(case_id,created_at desc);

create function private.case_projection_manifest(target_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
select jsonb_build_object(
 'case', jsonb_build_object('id',c.id,'serviceId',c.service_id,'slug',c.slug,'title',c.title,'summary',c.summary,
 'locationDisplay',c.location_display,'spaceType',c.space_type,'workDate',coalesce(c.work_date::text,''),
 'displayPeriod',c.display_period,'problemDescription',c.problem_description,'workDescription',c.work_description,
 'resultDescription',c.result_description,'seoTitle',coalesce(c.seo_title,''),'seoDescription',coalesce(c.seo_description,''),
 'featuredRank',c.featured_rank,'privacyChecklist',c.privacy_checklist,'status',c.status,
 'publishedAt',c.published_at,'createdAt',c.created_at,'updatedAt',c.updated_at,'updatedBy',c.updated_by),
 'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'caseId',m.case_id,'stage',m.stage,'sortOrder',m.sort_order,
 'cover',m.is_cover,'public',m.is_public,'altText',m.alt_text,'caption',m.caption,'width',m.width,'height',m.height,
 'mimeType',m.mime_type,'sizeBytes',m.size_bytes,'uploadStatus',m.upload_status,'storagePath',m.storage_path,
 'originalStoragePath',m.original_storage_path,'mockAssetKey',coalesce(m.mock_asset_key,''),'sessionPreviewId',null) order by m.sort_order,m.id)
 from public.case_media m where m.case_id=c.id),'[]'::jsonb),
 'videos',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'caseId',v.case_id,'youtubeVideoId',v.youtube_video_id,
 'originalUrl',v.original_url,'title',v.title,'caption',v.caption,'sortOrder',v.sort_order,'public',v.is_public) order by v.sort_order,v.id)
 from public.case_videos v where v.case_id=c.id),'[]'::jsonb),
 'tagIds',coalesce((select jsonb_agg(t.tag_id order by t.tag_id) from public.case_tags t where t.case_id=c.id),'[]'::jsonb))
from public.portfolio_cases c where c.id=target_id;
$$;
revoke all on function private.case_projection_manifest(uuid) from public,anon,authenticated;

-- Preserve every existing ID, slug, publication status, media path and public body.
insert into public.case_revision_history(case_id,revision,manifest,created_by,created_at)
select id,0,private.case_projection_manifest(id),updated_by,coalesce(published_at,updated_at) from public.portfolio_cases;
insert into public.case_revision_drafts(case_id,revision,manifest,updated_by,updated_at)
select id,0,private.case_projection_manifest(id),updated_by,updated_at from public.portfolio_cases where status='private';

create function private.validate_case_manifest(target_id uuid, document jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare item jsonb; body jsonb := document->'case'; service uuid; tag uuid;
begin
 if jsonb_typeof(body) is distinct from 'object' or jsonb_typeof(document->'media') is distinct from 'array'
 or jsonb_typeof(document->'videos') is distinct from 'array' or jsonb_typeof(document->'tagIds') is distinct from 'array'
 then raise exception 'invalid_case_manifest' using errcode='23514'; end if;
 if jsonb_array_length(document->'media')>69 then raise exception 'case_media_limit_exceeded' using errcode='23514'; end if;
 if jsonb_array_length(document->'videos')>3 then raise exception 'case_video_limit_exceeded' using errcode='23514'; end if;
 service := (body->>'serviceId')::uuid;
 if not exists(select 1 from public.services where id=service) then raise exception 'missing_service' using errcode='23514'; end if;
 if char_length(coalesce(body->>'title',''))>200 or char_length(coalesce(body->>'summary',''))>5000
 or char_length(document::text)>2000000 then raise exception 'case_content_too_large' using errcode='23514'; end if;
 if coalesce(body->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid_case_slug' using errcode='23514'; end if;
 if jsonb_typeof(body->'privacyChecklist') is distinct from 'object' then raise exception 'invalid_privacy_checklist' using errcode='23514'; end if;
 if (select count(*) from jsonb_array_elements(document->'media') m where (m->>'cover')::boolean)>1 then raise exception 'multiple_case_covers' using errcode='23514'; end if;
 if (select count(distinct m->>'id') from jsonb_array_elements(document->'media') m)<>jsonb_array_length(document->'media') then raise exception 'duplicate_media' using errcode='23514'; end if;
 for item in select value from jsonb_array_elements(document->'media') loop
   if exists(select 1 from public.media_cleanup_jobs j where (j.bucket='case-originals' and j.path=item->>'originalStoragePath') or (j.bucket='case-reviewed-public' and j.path=item->>'storagePath')) then raise exception 'asset_pending_cleanup' using errcode='23514'; end if;
   if item->>'stage' not in ('before','process','after','detail') or item->>'uploadStatus' not in ('queued','uploading','ready','failed')
   or coalesce((item->>'width')::int,0)<=0 or coalesce((item->>'height')::int,0)<=0
   or coalesce((item->>'sizeBytes')::bigint,0)<=0 or (item->>'sizeBytes')::bigint>20971520
   or item->>'mimeType' not in ('image/jpeg','image/png','image/webp','image/heic','image/heif')
   or coalesce((item->>'sortOrder')::int,-1)<0
   then raise exception 'invalid_case_media' using errcode='23514'; end if;
   if coalesce(item->>'storagePath','')<>'' and split_part(item->>'storagePath','/',1)<>target_id::text
   or coalesce(item->>'originalStoragePath','')<>'' and split_part(item->>'originalStoragePath','/',1)<>target_id::text
   then raise exception 'case_media_path_mismatch' using errcode='23514'; end if;
   if coalesce(item->>'storagePath','')='' and coalesce(item->>'mockAssetKey','')='' then raise exception 'case_media_source_required' using errcode='23514'; end if;
 end loop;
 if (select count(distinct v->>'youtubeVideoId') from jsonb_array_elements(document->'videos') v)<>jsonb_array_length(document->'videos') then raise exception 'duplicate_video' using errcode='23514'; end if;
 for item in select value from jsonb_array_elements(document->'videos') loop
   if coalesce(item->>'youtubeVideoId','') !~ '^[A-Za-z0-9_-]{11}$' or coalesce(item->>'originalUrl','') !~ '^https://' or coalesce((item->>'sortOrder')::int,-1)<0
   then raise exception 'invalid_case_video' using errcode='23514'; end if;
 end loop;
 for tag in select value::uuid from jsonb_array_elements_text(document->'tagIds') loop
   if not exists(select 1 from public.tags where id=tag and service_id=service) then raise exception 'case_tag_service_mismatch' using errcode='23514'; end if;
 end loop;
end;
$$;
revoke all on function private.validate_case_manifest(uuid,jsonb) from public,anon,authenticated;

create function public.create_case_revision(body jsonb) returns public.portfolio_cases
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_active_admin(); target public.portfolio_cases;
begin
 insert into public.portfolio_cases(service_id,title,location_display,created_by,updated_by)
 values((body->>'service_id')::uuid,trim(body->>'title'),trim(body->>'location_display'),actor,actor) returning * into target;
 insert into public.case_revision_drafts(case_id,revision,manifest,updated_by) values(target.id,0,private.case_projection_manifest(target.id),actor);
 perform private.record_admin_activity('create','case',target.id::text,'시공사례 초안 생성');
 return target;
end;
$$;

create function public.save_case_revision(case_id uuid,expected_revision bigint,patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_active_admin(); target public.portfolio_cases; previous jsonb; document jsonb; body jsonb; next_revision bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into target from public.portfolio_cases where id=case_id for update;
 if target.id is null then raise exception 'case_not_found' using errcode='P0002'; end if;
 if expected_revision is null or target.revision<>expected_revision then raise exception 'case_revision_conflict' using errcode='40001'; end if;
 if target.status='deleted' then raise exception 'restore_deleted_case_first' using errcode='23514'; end if;
 select manifest into previous from public.case_revision_drafts d where d.case_id=target.id;
 previous:=coalesce(previous,private.case_projection_manifest(target.id));
 -- Only editable keys may be changed. Identity and publication state are server-owned.
 body:=(previous->'case') || coalesce(patch->'case','{}'::jsonb);
 body:=body || jsonb_build_object('id',target.id,'status',target.status,'publishedAt',target.published_at,'createdAt',target.created_at,'updatedAt',now(),'updatedBy',actor);
 document:=jsonb_build_object('case',body,'media',coalesce(patch->'media',previous->'media'),
 'videos',coalesce(patch->'videos',previous->'videos'),'tagIds',case when body->>'serviceId' is distinct from previous#>>'{case,serviceId}' and not (patch ? 'tagIds') then '[]'::jsonb else coalesce(patch->'tagIds',previous->'tagIds') end);
 if exists(select 1 from jsonb_array_elements(document->'media') n where coalesce((n->>'public')::boolean,false) and not exists(
   select 1 from jsonb_array_elements(previous->'media') o where (o->>'public')::boolean and o->>'id'=n->>'id'
   and coalesce(o->>'storagePath','')=coalesce(n->>'storagePath','') and coalesce(o->>'mockAssetKey','')=coalesce(n->>'mockAssetKey','')))
 then document:=jsonb_set(document,'{case,privacyChecklist}',(document#>'{case,privacyChecklist}')||jsonb_build_object(
 'noIdentifiablePeople',false,'noVehiclePlates',false,'noDetailedAddressOrContact',false,'noPrivateDocumentsOrBelongings',false,'publicMediaReviewed',false)); end if;
 perform private.validate_case_manifest(target.id,document);
 next_revision:=target.revision+1;
 update public.portfolio_cases set revision=next_revision where id=target.id;
 insert into public.case_revision_drafts(case_id,revision,manifest,updated_by) values(target.id,next_revision,document,actor)
 on conflict on constraint case_revision_drafts_pkey do update set revision=excluded.revision,manifest=excluded.manifest,updated_by=actor,updated_at=now();
 perform private.record_admin_activity('save_draft','case',target.id::text,'시공사례 초안 저장');
 return jsonb_build_object('revision',next_revision,'manifest',document);
end;
$$;

create function public.publish_case_revision(case_id uuid,expected_revision bigint) returns public.portfolio_cases
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_active_admin(); target public.portfolio_cases; document jsonb; body jsonb; item jsonb; key text;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into target from public.portfolio_cases where id=case_id for update;
 if target.id is null then raise exception 'case_not_found' using errcode='P0002'; end if;
 if expected_revision is null or target.revision<>expected_revision then raise exception 'case_revision_conflict' using errcode='40001'; end if;
 if target.status='deleted' then raise exception 'deleted_case_cannot_publish' using errcode='23514'; end if;
 select manifest into document from public.case_revision_drafts d where d.case_id=target.id;
 if document is null then raise exception 'case_draft_required' using errcode='23514'; end if;
 perform private.validate_case_manifest(target.id,document); body:=document->'case';
 if char_length(trim(coalesce(body->>'title','')))=0 or char_length(trim(coalesce(body->>'locationDisplay','')))=0 then raise exception 'required_case_metadata' using errcode='23514'; end if;
 foreach key in array array['noIdentifiablePeople','noVehiclePlates','noDetailedAddressOrContact','noPrivateDocumentsOrBelongings','publicMediaReviewed'] loop
 if coalesce((body->'privacyChecklist'->>key)::boolean,false)=false then raise exception 'privacy_checklist_incomplete' using errcode='23514'; end if;
 end loop;
 if not exists(select 1 from jsonb_array_elements(document->'media') m where (m->>'cover')::boolean and (m->>'public')::boolean and m->>'uploadStatus'='ready') then raise exception 'public_ready_cover_required' using errcode='23514'; end if;
 if exists(select 1 from jsonb_array_elements(document->'media') m where (m->>'public')::boolean and (m->>'uploadStatus'<>'ready' or char_length(trim(coalesce(m->>'altText','')))=0)) then raise exception 'public_media_not_ready' using errcode='23514'; end if;
 if exists(select 1 from jsonb_array_elements(document->'media') m where (m->>'public')::boolean and coalesce(m->>'storagePath','')<>'' and not exists(select 1 from storage.objects o where o.bucket_id='case-reviewed-public' and o.name=m->>'storagePath')) then raise exception 'reviewed_file_missing' using errcode='23514'; end if;
 -- Both flags are local to this transaction. The public projection switches atomically.
 perform set_config('app.allow_case_transition','true',true);
 perform set_config('app.allow_published_asset_change','true',true);
 delete from public.case_tags t where t.case_id=target.id;
 delete from public.case_media m where m.case_id=target.id;
 delete from public.case_videos v where v.case_id=target.id;
 update public.portfolio_cases set service_id=(body->>'serviceId')::uuid,slug=body->>'slug',title=body->>'title',
 summary=coalesce(body->>'summary',''),location_display=body->>'locationDisplay',space_type=coalesce(body->>'spaceType',''),
 work_date=nullif(body->>'workDate','')::date,display_period=coalesce(body->>'displayPeriod',''),
 problem_description=coalesce(body->>'problemDescription',''),work_description=coalesce(body->>'workDescription',''),result_description=coalesce(body->>'resultDescription',''),
 seo_title=nullif(body->>'seoTitle',''),seo_description=nullif(body->>'seoDescription',''),featured_rank=(body->>'featuredRank')::int,
 privacy_checklist=(body->'privacyChecklist')||jsonb_build_object('requiredMetadataComplete',true,'hasPublicReadyMedia',true),
 status='published',published_at=now(),revision=target.revision+1,updated_by=actor where id=target.id returning * into target;
 for item in select value from jsonb_array_elements(document->'media') loop
 insert into public.case_media(id,case_id,stage,sort_order,is_cover,is_public,alt_text,caption,width,height,mime_type,size_bytes,upload_status,storage_path,original_storage_path,mock_asset_key)
 values(case when item->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then (item->>'id')::uuid else gen_random_uuid() end,
 target.id,(item->>'stage')::public.media_stage,(item->>'sortOrder')::int,(item->>'cover')::boolean,(item->>'public')::boolean,
 coalesce(item->>'altText',''),coalesce(item->>'caption',''),(item->>'width')::int,(item->>'height')::int,item->>'mimeType',(item->>'sizeBytes')::bigint,
 (item->>'uploadStatus')::public.upload_status,nullif(item->>'storagePath',''),nullif(item->>'originalStoragePath',''),nullif(item->>'mockAssetKey',''));
 end loop;
 for item in select value from jsonb_array_elements(document->'videos') loop
 insert into public.case_videos(id,case_id,youtube_video_id,original_url,title,caption,sort_order,is_public)
 values(case when item->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then (item->>'id')::uuid else gen_random_uuid() end,
 target.id,item->>'youtubeVideoId',item->>'originalUrl',coalesce(item->>'title',''),coalesce(item->>'caption',''),(item->>'sortOrder')::int,(item->>'public')::boolean);
 end loop;
 insert into public.case_tags(case_id,tag_id) select target.id,value::uuid from jsonb_array_elements_text(document->'tagIds') on conflict do nothing;
 insert into public.case_revision_history(case_id,revision,manifest,created_by) values(target.id,target.revision,private.case_projection_manifest(target.id),actor);
 delete from public.case_revision_drafts d where d.case_id=target.id;
 perform private.record_admin_activity('publish','case',target.id::text,'시공사례 공개본 갱신');
 return target;
end;
$$;

create function public.discard_case_revision(case_id uuid,expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=private.require_active_admin(); target public.portfolio_cases;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into target from public.portfolio_cases where id=case_id for update;
 if target.id is null then raise exception 'case_not_found' using errcode='P0002'; end if;
 if expected_revision is null or target.revision<>expected_revision then raise exception 'case_revision_conflict' using errcode='40001'; end if;
 delete from public.case_revision_drafts d where d.case_id=target.id;
 update public.portfolio_cases set revision=revision+1 where id=target.id;
 perform private.record_admin_activity('discard_draft','case',target.id::text,'시공사례 초안 폐기');
end;
$$;

create function public.restore_case_revision(case_id uuid,history_id uuid,expected_revision bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=private.require_active_admin(); document jsonb;
begin
 select manifest into document from public.case_revision_history h where h.id=history_id and h.case_id=restore_case_revision.case_id;
 if document is null then raise exception 'case_history_not_found' using errcode='P0002'; end if;
 return public.save_case_revision(case_id,expected_revision,document);
end;
$$;

create function public.transition_case_revision(case_id uuid,expected_revision bigint,operation text) returns public.portfolio_cases
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=private.require_active_admin(); target public.portfolio_cases;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into target from public.portfolio_cases where id=case_id for update;
 if target.id is null then raise exception 'case_not_found' using errcode='P0002'; end if;
 if expected_revision is null or target.revision<>expected_revision then raise exception 'case_revision_conflict' using errcode='40001'; end if;
 if operation is null or operation not in ('unpublish','trash','restore') then raise exception 'invalid_case_operation' using errcode='23514'; end if;
 if target.status='deleted' and operation<>'restore' then raise exception 'restore_deleted_case_first' using errcode='23514'; end if;
 if operation='restore' and target.status<>'deleted' then raise exception 'case_not_deleted' using errcode='23514'; end if;
 perform set_config('app.allow_case_transition','true',true);
 update public.portfolio_cases set status=case when operation='trash' then 'deleted'::public.case_status else 'private'::public.case_status end,
 published_at=null,revision=revision+1,updated_by=actor where id=target.id returning * into target;
 -- A previously published case has no draft. Prepare it for explicit republishing,
 -- while preserving any pending edits across unpublish and trash/restore.
 if target.status='private' then
  insert into public.case_revision_drafts(case_id,revision,manifest,updated_by)
  values(target.id,target.revision,private.case_projection_manifest(target.id),actor)
  on conflict on constraint case_revision_drafts_pkey do nothing;
 end if;
 update public.case_revision_drafts d set revision=target.revision,
 manifest=jsonb_set(d.manifest,'{case}',(d.manifest->'case')||jsonb_build_object(
 'status',target.status,'publishedAt',target.published_at,'updatedAt',target.updated_at,'updatedBy',actor)),
 updated_at=target.updated_at,updated_by=actor where d.case_id=target.id;
 perform private.record_admin_activity(operation,'case',target.id::text,'시공사례 공개 상태 변경');
 return target;
end;
$$;

-- Trusted functions are the only writable entry points, including old RPCs.
revoke insert,update,delete on public.portfolio_cases,public.case_media,public.case_videos,public.case_tags,public.tags from authenticated;
revoke all on function public.publish_case(uuid),public.unpublish_case(uuid),public.soft_delete_case(uuid),public.replace_case_media(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.create_case_revision(jsonb),public.save_case_revision(uuid,bigint,jsonb),public.publish_case_revision(uuid,bigint),public.discard_case_revision(uuid,bigint),public.restore_case_revision(uuid,uuid,bigint),public.transition_case_revision(uuid,bigint,text) from public,anon;
grant execute on function public.create_case_revision(jsonb),public.save_case_revision(uuid,bigint,jsonb),public.publish_case_revision(uuid,bigint),public.discard_case_revision(uuid,bigint),public.restore_case_revision(uuid,uuid,bigint),public.transition_case_revision(uuid,bigint,text) to authenticated;

create function public.save_case_tag(tag jsonb) returns public.tags
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=private.require_active_admin(); target public.tags;
begin
 insert into public.tags(id,service_id,key,name,type,sort_order,active)
 values(coalesce(nullif(tag->>'id','')::uuid,gen_random_uuid()),(tag->>'serviceId')::uuid,tag->>'key',trim(tag->>'name'),(tag->>'type')::public.tag_type,(tag->>'sortOrder')::int,(tag->>'active')::boolean)
 on conflict(id) do update set name=excluded.name,sort_order=excluded.sort_order,active=excluded.active returning * into target;
 if target.name='' then raise exception 'tag_name_required' using errcode='23514'; end if;
 perform private.record_admin_activity('save','case_tag',target.id::text,'사례 태그 변경'); return target;
end;
$$;
revoke all on function public.save_case_tag(jsonb) from public,anon;
grant execute on function public.save_case_tag(jsonb) to authenticated;

create function private.case_asset_referenced(bucket text,path text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.case_media m where case when bucket='case-originals' then m.original_storage_path=path when bucket='case-reviewed-public' then m.storage_path=path else false end)
 or exists(select 1 from (select manifest from public.case_revision_drafts union all select manifest from public.case_revision_history) s,
 lateral jsonb_array_elements(s.manifest->'media') m where case when bucket='case-originals' then m->>'originalStoragePath'=path when bucket='case-reviewed-public' then m->>'storagePath'=path else false end);
$$;
revoke all on function private.case_asset_referenced(text,text) from public,anon;
grant execute on function private.case_asset_referenced(text,text) to authenticated;
-- Referenced original and reviewed files cannot be replaced, even with an upsert.
create policy case_objects_preserve_references on storage.objects as restrictive for update to authenticated
using (bucket_id not in ('case-originals','case-reviewed-public') or not private.case_asset_referenced(bucket_id,name))
with check (bucket_id not in ('case-originals','case-reviewed-public') or not private.case_asset_referenced(bucket_id,name));
create policy case_objects_preserve_referenced_deletes on storage.objects as restrictive for delete to authenticated
using (bucket_id not in ('case-originals','case-reviewed-public') or not private.case_asset_referenced(bucket_id,name));
