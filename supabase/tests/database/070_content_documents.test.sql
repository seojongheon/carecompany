begin;
select set_config('app.allow_role_change','true',true);
insert into auth.users(id,email) values('a0000000-0000-4000-8000-000000000001','content-master@test.invalid'),('a0000000-0000-4000-8000-000000000002','content-admin@test.invalid'),('a0000000-0000-4000-8000-000000000003','content-customer@test.invalid');
update public.profiles set role='super_admin' where id='a0000000-0000-4000-8000-000000000001';
update public.profiles set role='admin' where id='a0000000-0000-4000-8000-000000000002';
select set_config('app.allow_role_change','false',true);
insert into public.content_documents(key,draft,published) values
('home','{"title":"home live","heroImageAlt":"alt","primaryCtaHref":"/portfolio"}','{"title":"home live","heroImageAlt":"alt","primaryCtaHref":"/portfolio"}'),
('about','{"title":"about live"}','{"title":"about live"}'),
('settings','{"businessName":"live"}','{"businessName":"live"}') on conflict(key) do update set draft=excluded.draft,published=excluded.published;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ declare initial integer; saved public.content_documents; version_id uuid; blocked boolean:=false; begin
 select revision into initial from public.content_documents where key='home';
 select * into saved from public.save_content_document('home',initial,'{"title":"home draft","heroImageAlt":"alt","primaryCtaHref":"/portfolio"}');
 if (public.get_published_site_content()->'home'->>'title')='home draft' then raise exception 'draft leaked'; end if;
 begin perform public.save_content_document('home',initial,'{"title":"stale draft"}'); exception when sqlstate 'P0001' then if sqlerrm='content_revision_conflict' then blocked:=true;else raise;end if; end;
 if not blocked then raise exception 'stale revision accepted'; end if;
 select * into saved from public.publish_content_document('home',saved.revision);
 if (public.get_published_site_content()->'home'->>'title')<>'home draft' then raise exception 'publish failed'; end if;
 if (public.get_published_site_content()->'about'->>'title')<>'about live' then raise exception 'section isolation failed'; end if;
 select id into version_id from public.content_document_versions where document_key='home' order by created_at desc limit 1;
 perform public.restore_content_document('home',saved.revision,version_id);
 if (public.get_published_site_content()->'home'->>'title')<>'home draft' then raise exception 'restore published immediately'; end if;
 blocked:=false;begin perform public.save_content_document('settings',1,'{"businessName":"bad"}');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'admin edited settings';end if;
 blocked:=false;begin perform public.publish_site_content();exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'legacy publish bypass';end if;
end $$;
-- Server actions are not the authorization or validation boundary: staff can call RPCs directly.
do $$ declare attack record; current_revision integer; blocked boolean; original jsonb; begin
 for attack in select * from (values
  ('about','{"title":"bad values","values":{}}'::jsonb),
  ('about','{"title":"bad row","values":[null]}'::jsonb),
  ('about','{"title":"bad text","values":[{"id":"v","title":{"unsafe":true},"description":"text"}]}'::jsonb),
  ('process','{"title":"bad steps","steps":null}'::jsonb),
  ('process','{"title":"bad step","steps":["not an object"]}'::jsonb),
  ('home','{"title":"bad sections","sections":false}'::jsonb),
  ('home','{"title":"bad recommendations","recommendations":[{}]}'::jsonb),
  ('home','{"title":"bad image","image":{"path":"site/test.webp","alt":"test","focalX":{},"focalY":50}}'::jsonb),
  ('faq','{"items":[null]}'::jsonb),
  ('faq','{"items":[{"id":"q","visible":true,"question":{},"answer":"ok","category":"common"}]}'::jsonb),
  ('service:bathroom','{"key":"bathroom","name":"valid","summary":"valid","description":"valid","inclusions":[{}]}'::jsonb),
  ('pricing','{"lead":"valid","items":[{"id":"price","serviceKey":"bathroom","name":"valid","priceLabel":"valid","conditions":[{}]}]}'::jsonb)
 ) as cases(document_key,body) loop
  select revision,published into current_revision,original from public.content_documents where key=attack.document_key;
  blocked:=false;
  begin
   perform public.save_content_document(attack.document_key,current_revision,attack.body);
  exception when others then
   if sqlerrm='invalid_content_field_type' then blocked:=true;else raise;end if;
  end;
  if not blocked then raise exception 'direct RPC accepted malformed %: %',attack.document_key,attack.body;end if;
  if (select revision<>current_revision or published is distinct from original from public.content_documents where key=attack.document_key) then raise exception 'invalid content changed saved document';end if;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare saved public.content_documents; blocked boolean:=false; initial integer; asset uuid; job uuid; begin
 select revision into initial from public.content_documents where key='policy';
 select * into saved from public.save_content_document('policy',initial,'{"title":"정책","body":"검토할 내용","effectiveDate":"2026-10-19","inquiryConsent":"동의","reviewed":false}');
 begin perform public.publish_content_document('policy',saved.revision);exception when others then if sqlerrm='policy_review_required' then blocked:=true;else raise;end if;end;if not blocked then raise exception 'unreviewed policy published';end if;
 select public.register_media_asset('site/a0000000-0000-4000-8000-000000000004.webp','test.webp',100) into asset;
 insert into storage.objects(bucket_id,name,metadata) values('site-images','site/a0000000-0000-4000-8000-000000000004.webp','{"mimetype":"image/webp","size":100}');
 perform public.finish_media_upload(asset,true);
 select revision into initial from public.content_documents where key='about';
 select * into saved from public.save_content_document('about',initial,'{"title":"image draft","image":{"path":"site/a0000000-0000-4000-8000-000000000004.webp","alt":"test","focalX":50,"focalY":50}}');
 blocked:=false;begin perform public.request_media_cleanup(asset);exception when others then if sqlerrm='asset_in_use' then blocked:=true;else raise;end if;end;if not blocked then raise exception 'draft image deletion allowed';end if;
 delete from storage.objects where bucket_id='site-images' and name='site/a0000000-0000-4000-8000-000000000004.webp';
 if not exists(select 1 from storage.objects where bucket_id='site-images' and name='site/a0000000-0000-4000-8000-000000000004.webp') then raise exception 'storage direct deletion bypass';end if;
 select * into saved from public.publish_content_document('about',saved.revision);
 select * into saved from public.save_content_document('about',saved.revision,'{"title":"no image"}');
 select * into saved from public.publish_content_document('about',saved.revision);
 blocked:=false;begin perform public.request_media_cleanup(asset);exception when others then if sqlerrm='asset_in_use' then blocked:=true;else raise;end if;end;if not blocked then raise exception 'history image deletion allowed';end if;
 select public.register_media_asset('site/a0000000-0000-4000-8000-000000000005.webp','unused.webp',100) into asset;
 select public.request_media_cleanup(asset) into job;
 if job is null then raise exception 'cleanup not durable';end if;
 blocked:=false;begin perform public.save_content_document('about',saved.revision,'{"title":"reuse tombstone","image":{"path":"site/a0000000-0000-4000-8000-000000000005.webp","alt":"test"}}');exception when others then if sqlerrm='asset_pending_cleanup' then blocked:=true;else raise;end if;end;if not blocked then raise exception 'tombstoned asset reused';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$ declare count_rows integer; blocked boolean:=false; begin
 select count(*) into count_rows from public.content_documents;if count_rows<>0 then raise exception 'customer reads drafts';end if;
 begin perform public.save_content_document('home',1,'{}');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'customer edits documents';end if;
end $$;
reset role;
rollback;
