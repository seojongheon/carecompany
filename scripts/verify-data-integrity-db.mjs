import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
const db=new PGlite({extensions:{pgcrypto},loadDataDir:new Blob([await fs.readFile('.cache/operations-db/snapshot.tar.gz')])});
const migrationPath='supabase/migrations/20261023000200_content_data_integrity.sql';
let migration='';try{migration=await fs.readFile(migrationPath,'utf8')}catch(error){if(error.code!=='ENOENT')throw error}
const master='10000000-0000-4000-8000-000000000001';let checks=0;
const scalar=async(q,p=[])=>Object.values((await db.query(q,p)).rows[0])[0];
const same=async(q,value,label,p=[])=>{assert.deepEqual(await scalar(q,p),value,label);checks++};
const repair=async()=>{if(migration)await db.exec(migration)};
const price={id:'50000000-0000-4000-8000-000000000001',serviceKey:'bathroom',name:'기존 가격',priceLabel:'상담 후 안내',conditions:[],visible:true,sortOrder:0};
const settings={businessName:'기존 업체',footerDescription:'기존 소개',contactLabel:'기존 버튼',contactHref:'/portfolio',phone:''};
async function reset({edited=false,explicitEmpty=false}={}){
 await db.exec('reset role');
 await db.query(`update public.site_content set version=1,draft=$1 where id`,[explicitEmpty?{priceItems:[]}:{home:{title:'기존 홈'}}]);
 await db.exec("delete from public.site_content_versions;delete from public.content_document_versions where document_key in ('pricing','settings');delete from public.admin_activity_logs where target_id in ('pricing','settings')");
 await db.query("update public.content_documents set draft=$1,published=$1,revision=2,updated_by=null,published_by=null where key='settings'",[settings]);
 await db.query("update public.content_documents set draft=$1,published=$2,revision=2,updated_by=$3,published_by=null where key='pricing'",[{lead:'초안 안내 보존',items:[]},{lead:'공개 안내 보존',items:[price]},edited?master:null]);
}
try{
 await reset();const unrelated=await scalar("select jsonb_agg(to_jsonb(d) order by key) from public.content_documents d where key not in ('pricing','settings')");
 await repair();
 await same("select draft->'items' from public.content_documents where key='pricing'",[price],'migration restores unedited imported prices');
 await same("select draft->>'lead' from public.content_documents where key='pricing'",'초안 안내 보존','keeps other draft content');
 await same("select published from public.content_documents where key='pricing'",{lead:'공개 안내 보존',items:[price]},'does not publish repaired draft');
 await same("select revision from public.content_documents where key='pricing'",3,'repair invalidates stale editor revisions');
 const fixed=await scalar("select draft from public.content_documents where key='settings'");
 assert.equal(fixed.phone,'');assert.equal(fixed.businessName,settings.businessName);assert.equal(fixed.contactHref,settings.contactHref);assert.equal(fixed.headerCtaHref,'/inquiry');assert.equal(fixed.seoTitle,settings.businessName);checks+=5;
 await same("select jsonb_agg(to_jsonb(d) order by key) from public.content_documents d where key not in ('pricing','settings')",unrelated,'other documents unchanged');
 const once=await scalar("select jsonb_agg(to_jsonb(d) order by key) from public.content_documents d where key in ('pricing','settings')");await repair();
 await same("select jsonb_agg(to_jsonb(d) order by key) from public.content_documents d where key in ('pricing','settings')",once,'repair is idempotent');
 await reset({edited:true});await repair();await same("select draft->'items' from public.content_documents where key='pricing'",[],'operator emptied draft preserved');
 for(const [change,label] of [
  [`update public.content_documents set published_by='${master}' where key='pricing'`,'operator publication preserved'],
  ["update public.content_documents set revision=9 where key='pricing'",'changed revision preserved']
 ]){await reset();await db.exec(change);await repair();await same("select draft->'items' from public.content_documents where key='pricing'",[],label);}
 await reset({explicitEmpty:true});await repair();await same("select draft->'items' from public.content_documents where key='pricing'",[],'explicit legacy empty prices preserved');
 await db.exec("update public.content_documents set published=null where key='settings'");await repair();await same("select published from public.content_documents where key='settings'",null,'unpublished settings remain unpublished');
 await same("select column_default from information_schema.columns where table_schema='public' and table_name='services' and column_name='slug'",null,'canonical services have no case slug default');
 await reset();await db.exec("insert into public.admin_activity_logs(action,target_type,target_id,summary) values('draft_saved','content','pricing','fixture')");await repair();await same("select draft->'items' from public.content_documents where key='pricing'",[],'audited edit preserved');
 await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",[master]);await db.exec('set role authenticated');
 const revision=await scalar("select revision from public.content_documents where key='pricing'");
 await assert.rejects(()=>db.query("select public.save_content_document('pricing',0,$1)",[{lead:'bad',items:[]}]),{message:'content_revision_conflict'});checks++;
 const legacy={...price,id:'legacy-price'};
 const saved=(await db.query("select * from public.save_content_document('pricing',$1,$2)",[revision,{lead:'가격 안내',items:[legacy]}])).rows[0];
 const first=(await db.query("select * from public.publish_content_document('pricing',$1)",[saved.revision])).rows[0];
 const id=first.published.items[0].id;
 assert.match(id,/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/,'published document must use canonical price ID');checks++;
 await same("select id::text from public.price_items where name='기존 가격'",id,'projection and published IDs agree');
 assert.equal(first.draft.items[0].id,id);checks++;
 const again=(await db.query("select * from public.publish_content_document('pricing',$1)",[first.revision])).rows[0];assert.equal(again.published.items[0].id,id);checks++;
 await same("select id::text from public.price_items where name='기존 가격'",id,'repeat publish preserves ID');
 const before=await scalar("select to_jsonb(d) from public.content_documents d where key='pricing'");
 await assert.rejects(()=>db.query("select public.save_content_document('pricing',$1,$2)",[again.revision,{lead:'duplicate',items:[{...price,id},{...price,id}]}]));checks++;
 await same("select to_jsonb(d) from public.content_documents d where key='pricing'",before,'invalid save leaves document unchanged');
 const history=await scalar("select id::text from public.content_document_versions where document_key='pricing' order by revision limit 1");
 const restored=(await db.query("select * from public.restore_content_document('pricing',$1,$2)",[again.revision,history])).rows[0];
 assert.equal(restored.published.items[0].id,id);checks++;
 const republished=(await db.query("select * from public.publish_content_document('pricing',$1)",[restored.revision])).rows[0];
 assert.equal(republished.published.items[0].id,price.id);checks++;
 await same("select id::text from public.price_items where name='기존 가격'",price.id,'restored price identity matches projection');
 const duplicateUuid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const invalid=(await db.query("select * from public.save_content_document('pricing',$1,$2)",[republished.revision,{lead:'UUID normalization collision',items:[{...price,id:duplicateUuid},{...price,id:duplicateUuid.toUpperCase()}]}])).rows[0];
 const documentBefore=await scalar("select to_jsonb(d) from public.content_documents d where key='pricing'");
 const pricesBefore=await scalar("select jsonb_agg(to_jsonb(p) order by id) from public.price_items p");
 await assert.rejects(()=>db.query("select * from public.publish_content_document('pricing',$1)",[invalid.revision]),{code:'23505'});checks++;
 await same("select to_jsonb(d) from public.content_documents d where key='pricing'",documentBefore,'failed publication preserves saved draft and public document');
 await same("select jsonb_agg(to_jsonb(p) order by id) from public.price_items p",pricesBefore,'failed publication rolls back projection replacement');
 console.log(`PASS ${checks} data-integrity assertions (safe backfill, preservation, CAS, canonical price IDs and repeated publication).`);
}catch(error){console.error(error.message);process.exitCode=1}finally{await db.close()}
