begin;

create table public.content_documents (
  key text primary key check (key in ('home','about','process','policy','settings','pricing','faq') or key ~ '^service:(bathroom|aircon|apartment-window|commercial-window)$' or key ~ '^announcement:[a-z0-9-]{1,80}$'),
  revision integer not null default 1 check (revision > 0),
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  published jsonb,
  updated_by uuid references public.profiles(id),
  published_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create table public.content_document_versions (
  id uuid primary key default gen_random_uuid(), document_key text not null references public.content_documents(key),
  revision integer not null, content jsonb not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(document_key,revision)
);
alter table public.content_documents enable row level security;
alter table public.content_document_versions enable row level security;
grant select on public.content_documents, public.content_document_versions to authenticated;
create policy content_documents_staff_read on public.content_documents for select to authenticated using ((select private.is_active_admin()));
create policy content_versions_staff_read on public.content_document_versions for select to authenticated using ((select private.is_active_admin()));

-- Retain all published and uncommitted content, IDs and storage paths.
insert into public.content_documents(key,draft,published,published_at)
select section, coalesce(sc.draft->section,'{}'), coalesce(sc.published->section,'{}'), sc.published_at
from public.site_content sc cross join unnest(array['home','about','settings']) section where sc.id;
insert into public.content_documents(key,draft,published,published_at)
select 'process', jsonb_build_object('title','확인부터 마무리까지','description','현장에 맞는 범위를 확인하고 안전하게 작업합니다.','steps',coalesce(draft->'processSteps','[]')), jsonb_build_object('title','확인부터 마무리까지','description','현장에 맞는 범위를 확인하고 안전하게 작업합니다.','steps',coalesce(published->'processSteps','[]')), published_at from public.site_content where id;
insert into public.content_documents(key,draft,published,published_at)
select 'pricing', jsonb_build_object('lead',coalesce(draft->>'pricingLead','현장 조건을 확인한 후 안내합니다.'),'items',coalesce(draft->'priceItems','[]')), jsonb_build_object('lead',coalesce(published->>'pricingLead','현장 조건을 확인한 후 안내합니다.'),'items',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'serviceKey',p.service_key,'name',p.name,'priceLabel',p.price_label,'conditions',p.conditions,'visible',p.visible,'sortOrder',p.sort_order) order by p.sort_order) from public.price_items p),'[]')), published_at from public.site_content where id;
insert into public.content_documents(key,draft,published,published_at)
select 'service:'||key, jsonb_build_object('key',key,'name',name,'summary',summary,'description',description,'coverAssetKey',cover_asset_key,'active',active,'sortOrder',sort_order,'inclusions','[]'::jsonb,'exclusions','[]'::jsonb), jsonb_build_object('key',key,'name',name,'summary',summary,'description',description,'coverAssetKey',cover_asset_key,'active',active,'sortOrder',sort_order,'inclusions','[]'::jsonb,'exclusions','[]'::jsonb), now() from public.services;
insert into public.content_documents(key,draft,published,published_at) values
('faq','{"items":[{"id":"photo","question":"사진만으로 정확한 금액을 알 수 있나요?","answer":"사진은 범위를 파악하는 데 도움이 되지만, 현장 상태와 작업 가능 범위를 함께 확인해야 최종 안내가 가능합니다.","category":"pricing","serviceKey":"","visible":true,"sortOrder":0},{"id":"case-price","question":"사례의 작업 가격은 왜 없나요?","answer":"당시 조건이 다른 가격을 현재 현장에 그대로 적용하는 오해를 막기 위해 개별 사례 가격을 공개하지 않습니다.","category":"pricing","serviceKey":"","visible":true,"sortOrder":1}]}',null,null),
('policy','{"title":"개인정보처리방침","body":"개인정보 처리 목적, 항목, 보유 기간, 권리 행사 방법과 담당 연락처를 확인한 후 게시해 주세요.","effectiveDate":"2026-10-19","inquiryConsent":"문의 상담을 위한 이름, 연락처, 지역, 문의 내용 및 선택 사진의 수집·이용에 동의합니다.","reviewed":false}',null,null);
update public.content_documents set published=draft, published_at=now() where key='faq';

-- Preserve pre-migration document history in the new independent editor.
insert into public.content_document_versions(document_key,revision,content,created_by,created_at)
select section,v.version,case section
 when 'process' then jsonb_build_object('title','확인부터 마무리까지','description','현장에 맞는 범위를 확인하고 안전하게 작업합니다.','steps',coalesce(v.content->'processSteps','[]'))
 when 'pricing' then jsonb_build_object('lead',coalesce(v.content->>'pricingLead','가격 안내'),'items',coalesce(v.content->'priceItems','[]'))
 else v.content->section end,v.created_by,v.created_at
from public.site_content_versions v cross join unnest(array['home','about','process','pricing','settings']) section
where exists(select 1 from public.content_documents d where d.key=section) and (section in ('process','pricing') or v.content ? section);
update public.content_documents set revision=greatest(revision,coalesce((select max(version)+1 from public.site_content_versions),1),coalesce((select version+1 from public.site_content where id),1)) where key in ('home','about','process','pricing','settings');

alter table public.price_items drop constraint if exists price_items_service_key_key;
alter table public.price_items add column unit text not null default '', add column min_price numeric, add column max_price numeric, add column inclusions text[] not null default '{}', add column exclusions text[] not null default '{}';
alter table public.price_items add constraint prices_valid_range check ((min_price is null or min_price >= 0) and (max_price is null or max_price >= coalesce(min_price,0)));

create table public.media_assets (
  id uuid primary key default gen_random_uuid(), bucket text not null check(bucket in ('site-images','landing-hero','case-originals','case-reviewed-public')),
  path text not null, name text not null, mime_type text not null, size_bytes bigint not null check(size_bytes >= 0),
  owner_id uuid references public.profiles(id), status text not null default 'ready' check(status in ('uploading','ready','failed','deleting','deleted')),
  created_at timestamptz not null default now(), unique(bucket,path)
);
create table public.media_cleanup_jobs (
  id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.media_assets(id), bucket text not null, path text not null,
  status text not null default 'pending' check(status in ('pending','failed','completed')), attempts integer not null default 0,
  last_error text, requested_by uuid references public.profiles(id), created_at timestamptz not null default now(), completed_at timestamptz, unique(bucket,path)
);
alter table public.media_assets enable row level security;
alter table public.media_cleanup_jobs enable row level security;
grant select on public.media_assets, public.media_cleanup_jobs to authenticated;
create policy media_assets_staff_read on public.media_assets for select to authenticated using ((select private.is_active_admin()));
create policy media_jobs_staff_read on public.media_cleanup_jobs for select to authenticated using ((select private.is_active_admin()));
insert into public.media_assets(bucket,path,name,mime_type,size_bytes,owner_id)
select bucket_id,name,split_part(name,'/',array_length(string_to_array(name,'/'),1)),coalesce(metadata->>'mimetype','image/webp'),coalesce((metadata->>'size')::bigint,0),owner from storage.objects where bucket_id in ('landing-hero','case-originals','case-reviewed-public') on conflict do nothing;

create or replace function private.json_has_asset(value jsonb, candidate_path text) returns boolean language sql immutable set search_path='' as $$
 select jsonb_path_exists(value, '$.** ? (@ == $path)', jsonb_build_object('path',candidate_path))
$$;
create or replace function private.content_asset_referenced(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$
 select bucket in ('site-images','landing-hero') and (
 exists(select 1 from public.content_documents d where private.json_has_asset(d.draft,path) or private.json_has_asset(d.published,path)) or
 exists(select 1 from public.content_document_versions v where private.json_has_asset(v.content,path)) or
 exists(select 1 from public.site_content_versions v where private.json_has_asset(v.content,path)))
$$;
create or replace function private.media_asset_deletable(bucket text,path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare referenced boolean := false;
begin
 if not private.is_active_admin() or bucket not in ('site-images','landing-hero','case-originals','case-reviewed-public') then return false; end if;
 if private.content_asset_referenced(bucket,path) then return false; end if;
 if to_regprocedure('private.case_asset_referenced(text,text)') is not null then
  execute 'select private.case_asset_referenced($1,$2)' into referenced using bucket,path;
 elsif bucket in ('case-originals','case-reviewed-public') then
  select exists(select 1 from public.case_media m where m.storage_path=path or m.original_storage_path=path) into referenced;
 end if;
 return not referenced;
end $$;

-- RPC clients bypass the TypeScript schema. Reject malformed JSON before it can
-- reach published readers, while retaining optional fields in migrated history.
create or replace function private.validate_content_field_types(content jsonb) returns void language plpgsql set search_path='' as $$
declare field text; value jsonb; item jsonb; expected_type text;
begin
 if jsonb_typeof(content) is distinct from 'object' then raise exception 'invalid_content_field_type'; end if;
 for field,value in select key,v from jsonb_each(content) as fields(key,v) loop
  expected_type:=case
   when field=any(array['id','key','title','description','eyebrow','primaryCtaLabel','primaryCtaHref','heroImageAlt','heroAssetKey','heroImageStoragePath','ctaLabel','ctaHref','body','effectiveDate','inquiryConsent','businessName','representative','registrationNumber','footerDescription','contactLabel','contactHref','phone','address','hours','email','socialHref','kakaoHref','seoTitle','seoDescription','headerCtaLabel','headerCtaHref','lead','serviceKey','name','priceLabel','unit','question','answer','category','summary','coverAssetKey','scope','status','path','alt']) then 'string'
   when field=any(array['visible','active','reviewed','pinned']) then 'boolean'
   when field=any(array['sortOrder','focalX','focalY','minPrice','maxPrice']) then 'number'
   when field=any(array['sections','recommendations','blocks','values','steps','items','regions','conditions','inclusions','exclusions','precautions','faqIds','caseIds','images']) then 'array'
   when field=any(array['image','logo','shareImage']) then 'object'
   else null end;
  if expected_type is null then continue; end if;
  if field in ('minPrice','maxPrice') and value='null'::jsonb then continue; end if;
  if jsonb_typeof(value) is distinct from expected_type then raise exception 'invalid_content_field_type'; end if;
  if expected_type='array' then
   for item in select * from jsonb_array_elements(value) loop
    if field=any(array['regions','conditions','inclusions','exclusions','precautions','faqIds','caseIds','recommendations']) then
     if jsonb_typeof(item) is distinct from 'string' then raise exception 'invalid_content_field_type'; end if;
    else
     perform private.validate_content_field_types(item);
    end if;
   end loop;
  elsif expected_type='object' then
   perform private.validate_content_field_types(value);
  end if;
 end loop;
end $$;
revoke all on function private.validate_content_field_types(jsonb) from public,anon,authenticated;

create or replace function private.validate_content_document(document_key text,content jsonb,publishing boolean default false) returns void language plpgsql set search_path='' as $$
declare item jsonb; link_value text; field text;
begin
 if content is null or jsonb_typeof(content)<>'object' or octet_length(content::text)>262144 then raise exception 'invalid_content_document'; end if;
 perform private.validate_content_field_types(content);
 if document_key in ('home','about','process','policy') or document_key like 'announcement:%' then
  if length(trim(coalesce(content->>'title','')))=0 then raise exception 'document_title_required'; end if;
 end if;
 if document_key like 'service:%' then
  if document_key<>'service:'||coalesce(content->>'key','') or length(trim(coalesce(content->>'name','')))=0 or length(trim(coalesce(content->>'summary','')))=0 or length(trim(coalesce(content->>'description','')))=0 then raise exception 'invalid_canonical_service'; end if;
 end if;
 for field,link_value in select key,value #>> '{}' from jsonb_each(content) where key in ('primaryCtaHref','ctaHref','contactHref','headerCtaHref','socialHref','kakaoHref') loop
  if link_value<>'' and link_value !~ '^/([^/\\]|$)' and link_value !~ '^https://[^[:space:]]+$' and link_value !~ '^tel:[+0-9 -]+$' and link_value !~ '^mailto:[^[:space:]@]+@[^[:space:]@]+$' then raise exception 'unsafe_content_link'; end if;
 end loop;
 if document_key='home' and content ? 'blocks' then
  if jsonb_typeof(content->'blocks') is distinct from 'array' or jsonb_array_length(content->'blocks')<>4 then raise exception 'invalid_home_blocks'; end if;
  if (select count(distinct value->>'key') from jsonb_array_elements(content->'blocks'))<>4 or exists(select 1 from jsonb_array_elements(content->'blocks') b where b->>'key' not in ('services','recent','recommendations','additional')) then raise exception 'invalid_home_blocks'; end if;
 end if;
 if document_key like 'service:%' then
  foreach field in array array['inclusions','exclusions','precautions','faqIds','caseIds'] loop
   if content ? field and jsonb_typeof(content->field) is distinct from 'array' then raise exception 'invalid_service_collection'; end if;
  end loop;
 end if;
 if document_key='policy' then
  if length(trim(coalesce(content->>'body','')))=0 or length(trim(coalesce(content->>'inquiryConsent','')))=0 or coalesce(content->>'effectiveDate','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_policy'; end if;
  if publishing and coalesce((content->>'reviewed')::boolean,false)=false then raise exception 'policy_review_required'; end if;
 end if;
 if document_key='pricing' then
  if length(trim(coalesce(content->>'lead','')))=0 or jsonb_typeof(content->'items') is distinct from 'array' or jsonb_array_length(content->'items')>100 then raise exception 'invalid_prices'; end if;
  for item in select value from jsonb_array_elements(content->'items') loop
   if coalesce(item->>'serviceKey','') not in ('bathroom','aircon','apartment-window','commercial-window') or length(trim(coalesce(item->>'name','')))=0 or length(trim(coalesce(item->>'priceLabel','')))=0 or (item->>'minPrice')::numeric<0 or (item->>'maxPrice')::numeric<coalesce((item->>'minPrice')::numeric,0) then raise exception 'invalid_price_item'; end if;
  end loop;
  if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(content->'items')) then raise exception 'duplicate_price_id'; end if;
 end if;
 if document_key='faq' and (jsonb_typeof(content->'items') is distinct from 'array' or jsonb_array_length(content->'items')>100) then raise exception 'invalid_faq'; end if;
 if document_key like 'announcement:%' and (length(trim(coalesce(content->>'body','')))=0 or coalesce(content->>'status','') not in ('published','hidden')) then raise exception 'invalid_announcement'; end if;
 -- Every image usage carries its own accessible description and focal position.
 for item in select jsonb_path_query(content,'$.** ? (@.path != "")') loop
  if jsonb_typeof(item)='object' and item ? 'path' and length(trim(coalesce(item->>'alt','')))=0 then raise exception 'image_alt_required'; end if;
 end loop;
 if exists(select 1 from public.media_cleanup_jobs j where private.json_has_asset(content,j.path)) or exists(select 1 from private.landing_hero_cleanup_jobs j where private.json_has_asset(content,j.storage_path)) then raise exception 'asset_pending_cleanup'; end if;
end $$;

create or replace function private.require_document_editor(document_key text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_active_admin();
begin
 if document_key in ('settings','policy') and not exists(select 1 from public.profiles where id=actor and role='super_admin' and is_active=true) then raise exception using errcode='42501',message='master_required'; end if;
 return actor;
end $$;

create or replace function public.save_content_document(document_key text,expected_revision integer,content jsonb) returns public.content_documents language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_document_editor(document_key); saved public.content_documents;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 perform private.validate_content_document(document_key,content,false);
 if expected_revision=0 and document_key like 'announcement:%' then
  insert into public.content_documents(key,draft,updated_by) values(document_key,content,actor) on conflict do nothing returning * into saved;
 else
  update public.content_documents d set draft=content,revision=d.revision+1,updated_by=actor,updated_at=now() where d.key=document_key and d.revision=expected_revision returning * into saved;
 end if;
 if saved.key is null then raise exception using errcode='40001',message='content_revision_conflict'; end if;
 perform private.record_admin_activity('draft_saved','content',document_key,'문서 초안 저장');
 return saved;
end $$;

create or replace function public.publish_content_document(document_key text,expected_revision integer) returns public.content_documents language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_document_editor(document_key); saved public.content_documents; item jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into saved from public.content_documents d where d.key=document_key for update;
 if saved.key is null or saved.revision<>expected_revision then raise exception using errcode='40001',message='content_revision_conflict'; end if;
 perform private.validate_content_document(document_key,saved.draft,true);
 if saved.published is not null then insert into public.content_document_versions(document_key,revision,content,created_by) values(saved.key,saved.revision,saved.published,actor); end if;
 if document_key like 'service:%' then
  update public.services set name=saved.draft->>'name',summary=saved.draft->>'summary',description=saved.draft->>'description',cover_asset_key=coalesce(saved.draft->>'coverAssetKey',cover_asset_key),active=coalesce((saved.draft->>'active')::boolean,true),sort_order=coalesce((saved.draft->>'sortOrder')::integer,0) where key=substring(document_key from 9);
 end if;
 if document_key='pricing' then
  delete from public.price_items;
  for item in select value from jsonb_array_elements(saved.draft->'items') loop
   insert into public.price_items(id,service_key,name,price_label,conditions,visible,sort_order,unit,min_price,max_price,inclusions,exclusions,updated_by)
   values(case when item->>'id' ~ '^[a-fA-F0-9-]{36}$' then (item->>'id')::uuid else gen_random_uuid() end,item->>'serviceKey',item->>'name',item->>'priceLabel',array(select jsonb_array_elements_text(coalesce(item->'conditions','[]'))),coalesce((item->>'visible')::boolean,true),coalesce((item->>'sortOrder')::integer,0),coalesce(item->>'unit',''),(item->>'minPrice')::numeric,(item->>'maxPrice')::numeric,array(select jsonb_array_elements_text(coalesce(item->'inclusions','[]'))),array(select jsonb_array_elements_text(coalesce(item->'exclusions','[]'))),actor);
  end loop;
 end if;
 update public.content_documents d set published=d.draft,revision=d.revision+1,published_by=actor,published_at=now(),updated_by=actor,updated_at=now() where d.key=document_key returning * into saved;
 perform private.record_admin_activity('published','content',document_key,'문서 게시');
 return saved;
end $$;

create or replace function public.restore_content_document(document_key text,expected_revision integer,version_id uuid) returns public.content_documents language plpgsql security definer set search_path='' as $$
declare content jsonb; saved public.content_documents;
begin
 perform private.require_document_editor(document_key);
 select v.content into content from public.content_document_versions v where v.id=version_id and v.document_key=restore_content_document.document_key;
 if content is null then raise exception 'content_version_not_found'; end if;
 if document_key='policy' then content=jsonb_set(content,'{reviewed}','false'); end if;
 select * into saved from public.save_content_document(document_key,expected_revision,content);
 perform private.record_admin_activity('restored_to_draft','content',document_key,'이전 문서를 초안으로 복원');
 return saved;
end $$;

create or replace function public.get_published_site_content() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_object_agg(key,published) from public.content_documents where key in ('home','about','settings','policy') and published is not null),'{}') || jsonb_build_object(
 'pricingLead',(select published->'lead' from public.content_documents where key='pricing'),
 'priceItems',coalesce((select published->'items' from public.content_documents where key='pricing'),'[]'),
 'process',(select published from public.content_documents where key='process'),
 'processSteps',coalesce((select published->'steps' from public.content_documents where key='process'),'[]'),
 'services',coalesce((select jsonb_agg(published) from public.content_documents where key like 'service:%' and published is not null),'[]'),
 'faq',coalesce((select published->'items' from public.content_documents where key='faq'),'[]'),
 'announcements',coalesce((select jsonb_agg(jsonb_build_object('key',key,'publishedAt',published_at)||published order by (published->>'pinned')::boolean desc,published_at desc) from public.content_documents where key like 'announcement:%' and published->>'status'='published'),'[]'))
$$;

-- Legacy RPCs cannot publish unrelated drafts or bypass master-only documents.
create or replace function public.update_site_content_draft(content jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ begin raise exception using errcode='42501',message='use_document_scoped_editor'; end $$;
create or replace function public.publish_site_content() returns jsonb language plpgsql security definer set search_path='' as $$ begin raise exception using errcode='42501',message='use_document_scoped_editor'; end $$;
create or replace function public.restore_site_content_version(version_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin raise exception using errcode='42501',message='use_document_scoped_editor'; end $$;
revoke insert,update,delete on public.site_content,public.site_content_versions,public.services,public.price_items from authenticated;

create or replace function public.register_media_asset(asset_path text,asset_name text,asset_size bigint,asset_status text default 'uploading') returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_active_admin(); result uuid;
begin
 if asset_path !~ '^site/[a-f0-9-]+\.webp$' or asset_size<=0 or asset_size>20971520 or asset_status not in ('uploading','ready','failed') then raise exception 'invalid_asset'; end if;
 insert into public.media_assets(bucket,path,name,mime_type,size_bytes,owner_id,status) values('site-images',asset_path,left(asset_name,200),'image/webp',asset_size,actor,asset_status) returning id into result;
 perform private.record_admin_activity('upload_started','media',result::text,'사이트 이미지 업로드 시작');
 return result;
end $$;
create or replace function private.notify_media_failure(event_key text,target_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if to_regprocedure('private.notify_operators(text,text,text,text,uuid)') is not null then
  execute 'select private.notify_operators($1,$2,$3,$4,$5)' using event_key,'operation.failed','이미지 업로드 또는 정리 작업을 확인해 주세요.',target_path,null::uuid;
 end if;
exception when others then
 -- Notification delivery must never roll back the recorded upload/cleanup outcome.
 null;
end $$;
revoke all on function private.notify_media_failure(text,text) from public,anon,authenticated;
create or replace function public.finish_media_upload(asset_id uuid,succeeded boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_active_admin();
 if succeeded and not exists(select 1 from storage.objects o join public.media_assets a on a.bucket=o.bucket_id and a.path=o.name where a.id=asset_id) then raise exception 'media_object_missing'; end if;
 update public.media_assets set status=case when succeeded then 'ready' else 'failed' end where id=asset_id and status in ('uploading','failed');
 perform private.record_admin_activity(case when succeeded then 'uploaded' else 'upload_failed' end,'media',asset_id::text,'이미지 업로드 상태 변경',case when succeeded then 'success' else 'failure' end,case when succeeded then null else 'storage_upload_failed' end);
 if not succeeded then perform private.notify_media_failure('media.upload.failed:'||asset_id::text,'/admin/media?tab=failed'); end if;
end $$;
create or replace function public.request_media_cleanup(asset_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_active_admin(); asset public.media_assets; job_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into asset from public.media_assets a where a.id=asset_id for update;
 if asset.id is null then raise exception 'asset_not_found'; end if;
 if not private.media_asset_deletable(asset.bucket,asset.path) then raise exception 'asset_in_use'; end if;
 insert into public.media_cleanup_jobs(asset_id,bucket,path,requested_by) values(asset.id,asset.bucket,asset.path,actor) on conflict(bucket,path) do update set status='pending',last_error=null returning id into job_id;
 update public.media_assets set status='deleting' where id=asset.id;
 perform private.record_admin_activity('cleanup_requested','media',asset.id::text,'미사용 이미지 정리 요청');
 return job_id;
end $$;
create or replace function public.finish_media_cleanup(job_id uuid,succeeded boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_active_admin();
 if succeeded and exists(select 1 from storage.objects o join public.media_cleanup_jobs j on j.bucket=o.bucket_id and j.path=o.name where j.id=job_id) then raise exception 'media_object_still_exists'; end if;
 update public.media_cleanup_jobs j set attempts=j.attempts+1,status=case when succeeded then 'completed' else 'failed' end,last_error=case when succeeded then null else 'storage_remove_failed' end,completed_at=case when succeeded then now() else null end where j.id=job_id;
 if succeeded then update public.media_assets a set status='deleted' from public.media_cleanup_jobs j where j.id=job_id and a.id=j.asset_id; end if;
 perform private.record_admin_activity(case when succeeded then 'cleanup_completed' else 'cleanup_failed' end,'media',job_id::text,'이미지 정리 작업 상태 변경',case when succeeded then 'success' else 'failure' end,case when succeeded then null else 'storage_remove_failed' end);
 if not succeeded then perform private.notify_media_failure('media.cleanup.failed:'||job_id::text,'/admin/media?tab=cleanup'); end if;
end $$;
create or replace function public.media_asset_usage(asset_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare asset public.media_assets; uses jsonb;
begin
 perform private.require_active_admin();
 select * into asset from public.media_assets where id=asset_id;
 select coalesce(jsonb_agg(jsonb_build_object('key',d.key,'draft',private.json_has_asset(d.draft,asset.path),'published',private.json_has_asset(d.published,asset.path))),'[]') into uses from public.content_documents d where private.json_has_asset(d.draft,asset.path) or private.json_has_asset(d.published,asset.path);
 return jsonb_build_object('deletable',private.media_asset_deletable(asset.bucket,asset.path),'documents',uses,'history',exists(select 1 from public.content_document_versions v where private.json_has_asset(v.content,asset.path)));
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-images','site-images',false,20971520,array['image/webp']) on conflict do nothing;
create policy site_images_staff_read on storage.objects for select to authenticated using(bucket_id='site-images' and (select private.is_active_admin()));
create policy site_images_staff_insert on storage.objects for insert to authenticated with check(bucket_id='site-images' and (select private.is_active_admin()) and exists(select 1 from public.media_assets a where a.bucket=objects.bucket_id and a.path=objects.name and a.status='uploading'));
create or replace function private.site_asset_published(asset_path text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.content_documents d where d.published is not null and (d.key not like 'announcement:%' or d.published->>'status'='published') and private.json_has_asset(d.published,asset_path)) $$;
create policy site_images_public_read on storage.objects for select to anon,authenticated using(bucket_id='site-images' and private.site_asset_published(name));
drop policy if exists landing_hero_public_read on storage.objects;
create policy landing_hero_public_read on storage.objects for select to anon,authenticated using(bucket_id='landing-hero' and private.site_asset_published(name));
drop policy if exists landing_hero_admin_delete on storage.objects;
drop policy if exists case_originals_admin_delete on storage.objects;
drop policy if exists case_reviewed_admin_delete on storage.objects;
create policy media_safe_delete on storage.objects for delete to authenticated using(private.media_asset_deletable(bucket_id,name));
-- Immutable object names prevent replacing an already published image in place.
drop policy if exists landing_hero_admin_update on storage.objects;
drop policy if exists case_originals_admin_update on storage.objects;
drop policy if exists case_reviewed_admin_update on storage.objects;

create or replace function public.claim_landing_hero_cleanup(storage_path text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_active_admin();
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 if not private.media_asset_deletable('landing-hero',storage_path) then return false; end if;
 insert into private.landing_hero_cleanup_jobs(storage_path,requested_by) values(storage_path,actor) on conflict(storage_path) do update set attempts=landing_hero_cleanup_jobs.attempts+1;
 return true;
end $$;

revoke all on function private.json_has_asset(jsonb,text),private.content_asset_referenced(text,text),private.media_asset_deletable(text,text),private.validate_content_document(text,jsonb,boolean),private.require_document_editor(text),private.site_asset_published(text) from public;
grant execute on function private.media_asset_deletable(text,text) to authenticated;
grant execute on function private.site_asset_published(text) to anon,authenticated;
revoke all on function public.save_content_document(text,integer,jsonb),public.publish_content_document(text,integer),public.restore_content_document(text,integer,uuid),public.register_media_asset(text,text,bigint,text),public.finish_media_upload(uuid,boolean),public.request_media_cleanup(uuid),public.finish_media_cleanup(uuid,boolean),public.media_asset_usage(uuid) from public,anon;
grant execute on function public.save_content_document(text,integer,jsonb),public.publish_content_document(text,integer),public.restore_content_document(text,integer,uuid),public.register_media_asset(text,text,bigint,text),public.finish_media_upload(uuid,boolean),public.request_media_cleanup(uuid),public.finish_media_cleanup(uuid,boolean),public.media_asset_usage(uuid) to authenticated;

-- Include new case uploads in the library without changing existing object paths.
create or replace function private.track_case_storage_asset() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.bucket_id in ('case-originals','case-reviewed-public') then
  insert into public.media_assets(bucket,path,name,mime_type,size_bytes,owner_id,status)
  values(new.bucket_id,new.name,split_part(new.name,'/',array_length(string_to_array(new.name,'/'),1)),coalesce(new.metadata->>'mimetype','image/webp'),coalesce((new.metadata->>'size')::bigint,0),case when exists(select 1 from public.profiles p where p.id=new.owner) then new.owner else null end,'ready') on conflict(bucket,path) do nothing;
 end if;
 return new;
end $$;
create trigger track_case_storage_asset after insert on storage.objects for each row execute function private.track_case_storage_asset();
revoke all on function private.track_case_storage_asset() from public,anon,authenticated;

create or replace function public.is_landing_hero_referenced(storage_path text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_active_admin();
 return private.content_asset_referenced('landing-hero',storage_path);
end $$;
commit;
