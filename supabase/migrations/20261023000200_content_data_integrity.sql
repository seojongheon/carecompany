begin;

-- Upgrade only absent settings keys. Never infer real business/contact details,
-- overwrite an explicit value, publish a null public document, or rewrite history.
do $$
declare document public.content_documents; body jsonb; defaults jsonb; slot text;
        next_draft jsonb; next_published jsonb;
begin
 select * into document from public.content_documents where key='settings' for update;
 if not found then return; end if;
 next_draft:=document.draft; next_published:=document.published;
 foreach slot in array array['draft','published'] loop
  body:=case when slot='draft' then document.draft else document.published end;
  if body is null then continue; end if;
  defaults:=jsonb_build_object(
   'representative','','registrationNumber','','phone','','address','','hours','',
   'regions','[]'::jsonb,'email','','socialHref','','kakaoHref','',
   'logo',jsonb_build_object('path','','alt','','focalX',50,'focalY',50),
   'shareImage',jsonb_build_object('path','','alt','','focalX',50,'focalY',50),
   'seoTitle',coalesce(body->>'businessName',''),
   'seoDescription',coalesce(body->>'footerDescription',''),
   'headerCtaLabel','문의하기','headerCtaHref','/inquiry');
  if slot='draft' then next_draft:=defaults||body; else next_published:=defaults||body; end if;
 end loop;
 if next_draft is distinct from document.draft or next_published is distinct from document.published then
  update public.content_documents set draft=next_draft,published=next_published,revision=revision+1 where key='settings';
 end if;
end $$;

-- The original importer sourced public prices from price_items but turned an
-- absent legacy draft.priceItems key into []. Repair only that untouched state.
-- An explicit [] or any operator edit/history must remain authoritative.
update public.content_documents d
set draft=jsonb_set(d.draft,'{items}',d.published->'items'),revision=d.revision+1
where d.key='pricing' and d.updated_by is null and d.published_by is null
 and d.draft->'items'='[]'::jsonb and jsonb_array_length(d.published->'items')>0
 and d.revision=greatest(1,coalesce((select max(version)+1 from public.site_content_versions),1),coalesce((select version+1 from public.site_content where id),1))
 and exists(select 1 from public.site_content s where s.id and not (s.draft ? 'priceItems'))
 and not exists(select 1 from public.admin_activity_logs a where a.target_type='content' and a.target_id='pricing');

-- Services have canonical slugs; the old case-style default was never valid.
-- The linked database already has no default, so existing values are untouched.
alter table public.services alter column slug drop default;

-- Canonicalize legacy price IDs once, in the same publication transaction as
-- the document and price projection. Existing UUID identities remain stable.
create or replace function public.publish_content_document(document_key text,expected_revision integer) returns public.content_documents language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_document_editor(document_key); saved public.content_documents; item jsonb; normalized_items jsonb:='[]'::jsonb; price_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('content-media',0));
 select * into saved from public.content_documents d where d.key=document_key for update;
 if saved.key is null or saved.revision<>expected_revision then raise exception using errcode='P0001',message='content_revision_conflict'; end if;
 perform private.validate_content_document(document_key,saved.draft,true);
 if saved.published is not null then insert into public.content_document_versions(document_key,revision,content,created_by) values(saved.key,saved.revision,saved.published,actor); end if;
 if document_key like 'service:%' then
  update public.services set name=saved.draft->>'name',summary=saved.draft->>'summary',description=saved.draft->>'description',cover_asset_key=coalesce(saved.draft->>'coverAssetKey',cover_asset_key),active=coalesce((saved.draft->>'active')::boolean,true),sort_order=coalesce((saved.draft->>'sortOrder')::integer,0) where key=substring(document_key from 9);
 end if;
 if document_key='pricing' then
  delete from public.price_items;
  for item in select value from jsonb_array_elements(saved.draft->'items') loop
   price_id:=case when item->>'id' ~* '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$' then (item->>'id')::uuid else gen_random_uuid() end;
   item:=jsonb_set(item,'{id}',to_jsonb(price_id::text));
   normalized_items:=normalized_items||jsonb_build_array(item);
   insert into public.price_items(id,service_key,name,price_label,conditions,visible,sort_order,unit,min_price,max_price,inclusions,exclusions,updated_by)
   values(price_id,item->>'serviceKey',item->>'name',item->>'priceLabel',array(select jsonb_array_elements_text(coalesce(item->'conditions','[]'))),coalesce((item->>'visible')::boolean,true),coalesce((item->>'sortOrder')::integer,0),coalesce(item->>'unit',''),(item->>'minPrice')::numeric,(item->>'maxPrice')::numeric,array(select jsonb_array_elements_text(coalesce(item->'inclusions','[]'))),array(select jsonb_array_elements_text(coalesce(item->'exclusions','[]'))),actor);
  end loop;
  saved.draft:=jsonb_set(saved.draft,'{items}',normalized_items);
 end if;
 update public.content_documents d set draft=saved.draft,published=saved.draft,revision=d.revision+1,published_by=actor,published_at=now(),updated_by=actor,updated_at=now() where d.key=document_key returning * into saved;
 perform private.record_admin_activity('published','content',document_key,'문서 게시');
 return saved;
end $$;

commit;
