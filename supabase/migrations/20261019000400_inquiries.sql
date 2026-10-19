begin;
create sequence private.inquiry_receipt_seq;
create table public.inquiries (
 id uuid primary key default gen_random_uuid(),
 receipt_number text not null unique default ('I-'||to_char(now() at time zone 'Asia/Seoul','YYYYMMDD')||'-'||lpad(nextval('private.inquiry_receipt_seq')::text,8,'0')),
 customer_id uuid references public.profiles(id),name text not null check(length(name) between 1 and 80),
 phone text not null check(phone ~ '^\+?[0-9]{8,15}$'),service text not null check(service in ('bathroom','aircon','apartment-window','commercial-window')),
 region text not null check(length(region) between 1 and 160),message text not null check(length(message) between 1 and 5000),
 consent_at timestamptz not null default now(),status text not null default 'new' check(status in ('new','consulting','on_hold','completed','spam')),
 source text not null default 'web' check(source in ('web','phone','kakao')),assignee_id uuid references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index inquiries_created_idx on public.inquiries(created_at desc,id);
create index inquiries_customer_idx on public.inquiries(customer_id,created_at desc);
create index inquiries_assignee_idx on public.inquiries(assignee_id,status);
create table public.inquiry_attachments (
 id uuid primary key default gen_random_uuid(),inquiry_id uuid not null references public.inquiries(id),
 storage_path text not null unique check(storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
 file_name text not null check(length(file_name) between 1 and 160),mime_type text not null check(mime_type='image/webp'),
 size_bytes integer not null check(size_bytes between 1 and 10485760),created_at timestamptz not null default now()
);
create table public.inquiry_notes (id uuid primary key default gen_random_uuid(),inquiry_id uuid not null references public.inquiries(id),actor_id uuid not null references public.profiles(id),body text not null check(length(body) between 1 and 5000),created_at timestamptz not null default now());
create table public.inquiry_changes (id uuid primary key default gen_random_uuid(),inquiry_id uuid not null references public.inquiries(id),actor_id uuid references public.profiles(id),action text not null,summary text not null check(length(summary)<=300),created_at timestamptz not null default now());
create table public.inquiry_reads (inquiry_id uuid not null references public.inquiries(id),user_id uuid not null references public.profiles(id),read_at timestamptz not null default now(),primary key(inquiry_id,user_id));
create table private.inquiry_upload_cleanup (storage_path text primary key check(storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),eligible_at timestamptz not null default now()+interval '1 day',attempts integer not null default 0,last_error text,created_at timestamptz not null default now());
create table private.inquiry_submissions (key text primary key,fingerprint text not null,inquiry_id uuid not null references public.inquiries(id),created_at timestamptz not null default now());
create table private.inquiry_rate_events (id bigint generated always as identity primary key,key text not null,created_at timestamptz not null default now());
create index inquiry_rate_events_key_time_idx on private.inquiry_rate_events(key,created_at);
create table public.operator_notifications (
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.profiles(id),event_key text not null,
 event_type text not null check(event_type in ('inquiry.created','inquiry.assigned','operation.failed')),
 title text not null check(length(title)<=200),target_path text not null check(target_path ~ '^/admin(/|$)'),
 read_at timestamptz,created_at timestamptz not null default now(),unique(recipient_id,event_key)
);
create index operator_notifications_user_time_idx on public.operator_notifications(recipient_id,created_at desc);
create table public.operator_notification_settings (
 id boolean primary key default true check(id),provider text not null default 'none' check(provider='none'),enabled boolean not null default false check(not enabled),
 recipients uuid[] not null default '{}',events text[] not null default array['inquiry.created','inquiry.assigned','operation.failed']::text[],
 template_reference text not null default '' check(length(template_reference)<=200),external_channels jsonb not null default '{"email":{"enabled":false,"provider":"none","recipients":[],"events":["inquiry.created","inquiry.assigned","operation.failed"],"templateReference":""},"sms":{"enabled":false,"provider":"none","recipients":[],"events":["inquiry.created","inquiry.assigned","operation.failed"],"templateReference":""},"kakao":{"enabled":false,"provider":"none","recipients":[],"events":["inquiry.created","inquiry.assigned","operation.failed"],"templateReference":""}}'::jsonb,updated_at timestamptz not null default now(),updated_by uuid references public.profiles(id)
);
insert into public.operator_notification_settings(id) values(true);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(),event_key text not null,recipient_id uuid not null references public.profiles(id),
 channel text not null check(channel in ('email','sms','kakao')),provider text not null,status text not null default 'blocked' check(status in ('blocked','pending','sent','failed')),created_at timestamptz not null default now(),unique(event_key,recipient_id,channel)
);
create table public.notification_attempts (id uuid primary key default gen_random_uuid(),outbox_id uuid not null references public.notification_outbox(id),status text not null check(status in ('failed','sent')),error_code text,provider_reference text,attempted_at timestamptz not null default now());

alter table public.inquiries enable row level security;
alter table public.inquiry_attachments enable row level security;
alter table public.inquiry_notes enable row level security;
alter table public.inquiry_changes enable row level security;
alter table public.inquiry_reads enable row level security;
alter table public.operator_notifications enable row level security;
alter table public.operator_notification_settings enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notification_attempts enable row level security;
revoke all on public.inquiries,public.inquiry_attachments,public.inquiry_notes,public.inquiry_changes,public.inquiry_reads,public.operator_notifications,public.operator_notification_settings,public.notification_outbox,public.notification_attempts from anon,authenticated;
grant select on public.inquiries,public.inquiry_attachments,public.inquiry_notes,public.inquiry_changes,public.inquiry_reads,public.operator_notifications,public.operator_notification_settings,public.notification_outbox,public.notification_attempts to authenticated;
create policy inquiries_staff_read on public.inquiries for select to authenticated using(private.is_active_admin());
create policy inquiry_attachments_staff_read on public.inquiry_attachments for select to authenticated using(private.is_active_admin());
create policy inquiry_notes_staff_read on public.inquiry_notes for select to authenticated using(private.is_active_admin());
create policy inquiry_changes_staff_read on public.inquiry_changes for select to authenticated using(private.is_active_admin());
create policy inquiry_reads_own on public.inquiry_reads for select to authenticated using(user_id=auth.uid() and private.is_active_admin());
create policy notifications_own on public.operator_notifications for select to authenticated using(recipient_id=auth.uid() and private.is_active_admin());
create policy notification_settings_master on public.operator_notification_settings for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active));
create policy notification_outbox_master on public.notification_outbox for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active));
create policy notification_attempts_master on public.notification_attempts for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active));

create function private.notify_operators(p_event_key text,p_event_type text,p_title text,p_target text,p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.operator_notifications(recipient_id,event_key,event_type,title,target_path)
 select p.id,p_event_key,p_event_type,left(p_title,200),p_target from public.profiles p cross join public.operator_notification_settings s
 where p.is_active and p.role in ('admin','super_admin') and p_event_type=any(s.events)
 and (p_recipient is null and (cardinality(s.recipients)=0 or p.id=any(s.recipients)) or p_recipient=p.id)
 on conflict(recipient_id,event_key) do nothing;
 -- No external outbox is queued while no adapter is connected. Enabling later must not replay history.
end;$$;
revoke all on function private.notify_operators(text,text,text,text,uuid) from public,anon,authenticated;


create function public.check_inquiry_submission_rate(p_rate_key text,p_phone_key text) returns void language plpgsql security definer set search_path='' as $$
declare v_key text;
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized';end if;
 if p_rate_key !~ '^[a-f0-9]{64}$' or p_phone_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid_submission';end if;
 for v_key in select 'attempt:'||k from unnest(array[p_rate_key,p_phone_key]) k order by k loop
  perform pg_advisory_xact_lock(hashtextextended(v_key,1));
  if (select count(*) from private.inquiry_rate_events where key=v_key and created_at>now()-interval '1 hour')>=10 then raise exception 'rate_limited';end if;
  insert into private.inquiry_rate_events(key) values(v_key);
 end loop;
end;$$;
revoke all on function public.check_inquiry_submission_rate(text,text) from public,anon,authenticated;
grant execute on function public.check_inquiry_submission_rate(text,text) to service_role;

create function public.submit_inquiry(p_key text,p_fingerprint text,p_rate_key text,p_phone_key text,p_customer uuid,p_input jsonb,p_attachments jsonb default '[]') returns jsonb language plpgsql security definer set search_path='' as $$
declare v_existing private.inquiry_submissions%rowtype;v_row public.inquiries%rowtype;v_file jsonb;v_key text;
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized'; end if;
 if p_key !~ '^[a-f0-9]{64}$' or p_fingerprint !~ '^[a-f0-9]{64}$' or p_rate_key !~ '^[a-f0-9]{64}$' or p_phone_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid_submission'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key,0));
 select * into v_existing from private.inquiry_submissions where key=p_key;
 if found then
  if v_existing.fingerprint<>p_fingerprint then raise exception 'idempotency_conflict'; end if;
  select * into v_row from public.inquiries where id=v_existing.inquiry_id;
  return jsonb_build_object('id',v_row.id,'receiptNumber',v_row.receipt_number,'duplicate',true);
 end if;
 if not exists(select 1 from public.content_documents where key='policy' and published->>'reviewed'='true' and length(btrim(published->>'inquiryConsent'))>0) then raise exception 'inquiry_policy_unavailable';end if;
 if p_customer is not null and not exists(select 1 from public.profiles where id=p_customer and is_active) then raise exception 'inactive_customer'; end if;
 if p_input->'consent' is distinct from 'true'::jsonb or jsonb_typeof(p_attachments)<>'array' or jsonb_array_length(p_attachments)>5 then raise exception 'invalid_submission'; end if;
 -- Lock rate keys in a stable order so concurrent requests cannot exceed the cap.
 for v_key in select k from unnest(array[p_rate_key,p_phone_key]) k order by k loop
  perform pg_advisory_xact_lock(hashtextextended(v_key,1));
  if (select count(*) from private.inquiry_rate_events where key=v_key and created_at>now()-interval '1 hour')>=5 then raise exception 'rate_limited'; end if;
 end loop;
 delete from private.inquiry_rate_events where created_at<now()-interval '1 day';
 insert into private.inquiry_rate_events(key) values(p_rate_key),(p_phone_key);
 insert into public.inquiries(customer_id,name,phone,service,region,message) values(p_customer,btrim(p_input->>'name'),p_input->>'phone',p_input->>'service',btrim(p_input->>'region'),btrim(p_input->>'message')) returning * into v_row;
 for v_file in select value from jsonb_array_elements(p_attachments) loop
  insert into public.inquiry_attachments(inquiry_id,storage_path,file_name,mime_type,size_bytes) values(v_row.id,v_file->>'storagePath',v_file->>'fileName','image/webp',(v_file->>'sizeBytes')::integer);
 end loop;
 delete from private.inquiry_upload_cleanup where storage_path in(select storage_path from public.inquiry_attachments where inquiry_id=v_row.id);
 insert into private.inquiry_submissions(key,fingerprint,inquiry_id) values(p_key,p_fingerprint,v_row.id);
 insert into public.inquiry_changes(inquiry_id,actor_id,action,summary) values(v_row.id,p_customer,'created','웹 문의 접수');
 begin perform private.notify_operators('inquiry.created:'||v_row.id,'inquiry.created','새 문의가 접수되었습니다.','/admin/inquiries/'||v_row.id); exception when others then
  -- Inquiry creation survives a notification failure; durable safe failure record can be retried operationally.
  insert into public.inquiry_changes(inquiry_id,action,summary) values(v_row.id,'notification_failed','운영 알림 생성 실패');
 end;
 return jsonb_build_object('id',v_row.id,'receiptNumber',v_row.receipt_number,'duplicate',false);
end;$$;
revoke all on function public.submit_inquiry(text,text,text,text,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.submit_inquiry(text,text,text,text,uuid,jsonb,jsonb) to service_role;

create function public.inquiry_submission_receipt(p_key text,p_fingerprint text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_submission private.inquiry_submissions%rowtype;v_receipt text;
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized'; end if;
 select * into v_submission from private.inquiry_submissions where key=p_key;
 if not found then return null; end if;
 if v_submission.fingerprint<>p_fingerprint then raise exception 'idempotency_conflict'; end if;
 select receipt_number into v_receipt from public.inquiries where id=v_submission.inquiry_id;
 return jsonb_build_object('receiptNumber',v_receipt);
end;$$;
revoke all on function public.inquiry_submission_receipt(text,text) from public,anon,authenticated;
grant execute on function public.inquiry_submission_receipt(text,text) to service_role;

create function public.report_inquiry_failure(p_event_key text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized'; end if;
 perform private.notify_operators('operation.failed:'||left(p_event_key,100),'operation.failed','문의 첨부 또는 접수 처리에 실패했습니다.','/admin/inquiries');
end;$$;
revoke all on function public.report_inquiry_failure(text) from public,anon,authenticated;
grant execute on function public.report_inquiry_failure(text) to service_role;

create function public.my_inquiries(p_page integer default 1) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_items jsonb;v_total integer;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'not_authorized'; end if;
 if p_page<1 or p_page>100000 then raise exception 'invalid_page'; end if;
 select count(*) into v_total from public.inquiries where customer_id=auth.uid();
 select coalesce(jsonb_agg(x),'[]') into v_items from(select id,receipt_number,name,phone,service,region,message,created_at,case status when 'consulting' then '상담 중' when 'on_hold' then '확인 중' when 'completed' then '처리 완료' else '접수 완료' end as customer_status from public.inquiries where customer_id=auth.uid() order by created_at desc,id limit 20 offset (p_page-1)*20)x;
 return jsonb_build_object('items',v_items,'total',v_total);
end;$$;
revoke all on function public.my_inquiries(integer) from public,anon;
grant execute on function public.my_inquiries(integer) to authenticated;

create function public.inquiry_staff_options() returns table(id uuid,email text) language plpgsql security definer set search_path='' as $$
begin perform private.require_active_admin();return query select p.id,p.email from public.profiles p where p.is_active and p.role in ('admin','super_admin') order by p.email;end;$$;
revoke all on function public.inquiry_staff_options() from public,anon;
grant execute on function public.inquiry_staff_options() to authenticated;

create function public.admin_inquiries(p_filters jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare v_page integer:=coalesce((p_filters->>'page')::integer,1);v_result jsonb;
begin
 perform private.require_active_admin();
 if v_page<1 or v_page>100000 then raise exception 'invalid_page'; end if;
 with filtered as (
 select i.*,not exists(select 1 from public.inquiry_reads r where r.inquiry_id=i.id and r.user_id=auth.uid() and r.read_at>=i.updated_at) as is_unread
 from public.inquiries i where
 (coalesce(p_filters->>'q','')='' or strpos(lower(i.receipt_number||' '||i.name||' '||i.phone||' '||i.message),lower(p_filters->>'q'))>0)
 and (p_filters->>'status' is null or i.status=p_filters->>'status' or p_filters->>'status'='open' and i.status in ('new','consulting','on_hold')) and (p_filters->>'service' is null or i.service=p_filters->>'service')
 and (p_filters->>'source' is null or i.source=p_filters->>'source')
 and (p_filters->>'owner' is null or i.customer_id::text=p_filters->>'owner')
 and (p_filters->>'from' is null or i.created_at>=(p_filters->>'from')::date::timestamp at time zone 'Asia/Seoul')
 and (p_filters->>'to' is null or i.created_at<((p_filters->>'to')::date+1)::timestamp at time zone 'Asia/Seoul')
 and (p_filters->>'assignee' is null or case p_filters->>'assignee' when 'unassigned' then i.assignee_id is null when 'mine' then i.assignee_id=auth.uid() else i.assignee_id::text=p_filters->>'assignee' end)
 ), final as(select * from filtered where coalesce(p_filters->>'unread','false')<>'true' or is_unread), paged as(select * from final order by case when p_filters->>'sort'='oldest' then created_at end asc,created_at desc,id limit 20 offset (v_page-1)*20)
 select jsonb_build_object('items',coalesce((select jsonb_agg(paged) from paged),'[]'),'total',(select count(*) from final)) into v_result;
 return v_result;
end;$$;
revoke all on function public.admin_inquiries(jsonb) from public,anon;
grant execute on function public.admin_inquiries(jsonb) to authenticated;

create function public.admin_inquiry_counts() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.require_active_admin();return(select jsonb_build_object('new',count(*) filter(where status='new'),'open',count(*) filter(where status in ('new','consulting','on_hold')),'mine',count(*) filter(where assignee_id=auth.uid() and status in ('new','consulting','on_hold')),'unassigned',count(*) filter(where assignee_id is null and status in ('new','consulting','on_hold'))) from public.inquiries);end;$$;
revoke all on function public.admin_inquiry_counts() from public,anon;
grant execute on function public.admin_inquiry_counts() to authenticated;

create function public.admin_update_inquiry(p_id uuid,p_status text,p_assignee uuid,p_expected_updated_at timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare v_old public.inquiries%rowtype;v_now timestamptz:=clock_timestamp();
begin
 perform private.require_active_admin();select * into v_old from public.inquiries where id=p_id for update;
 if not found then raise exception 'inquiry_not_found'; end if;
 if v_old.updated_at is distinct from p_expected_updated_at then raise exception 'inquiry_conflict'; end if;
 if p_status not in ('new','consulting','on_hold','completed','spam') then raise exception 'invalid_status'; end if;
 if p_assignee is not null and not exists(select 1 from public.profiles where id=p_assignee and is_active and role in ('admin','super_admin')) then raise exception 'invalid_assignee'; end if;
 update public.inquiries set status=p_status,assignee_id=p_assignee,updated_at=v_now where id=p_id;
 if v_old.status is distinct from p_status then insert into public.inquiry_changes(inquiry_id,actor_id,action,summary) values(p_id,auth.uid(),'status',v_old.status||' → '||p_status);end if;
 if v_old.assignee_id is distinct from p_assignee then
  insert into public.inquiry_changes(inquiry_id,actor_id,action,summary) values(p_id,auth.uid(),'assignment',case when p_assignee is null then '담당자 해제' else '담당자 변경' end);
  if p_assignee is not null then
   begin perform private.notify_operators('inquiry.assigned:'||p_id||':'||v_now,'inquiry.assigned','담당 문의가 배정되었습니다.','/admin/inquiries/'||p_id,p_assignee);exception when others then insert into public.inquiry_changes(inquiry_id,action,summary) values(p_id,'notification_failed','담당 알림 생성 실패');end;
  end if;
 end if;
 perform private.record_admin_activity('inquiry.update','inquiry',p_id::text,'문의 상태 또는 담당자 변경');
end;$$;
revoke all on function public.admin_update_inquiry(uuid,text,uuid,timestamptz) from public,anon;
grant execute on function public.admin_update_inquiry(uuid,text,uuid,timestamptz) to authenticated;

create function public.admin_add_inquiry_note(p_id uuid,p_body text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_active_admin();
 insert into public.inquiry_notes(inquiry_id,actor_id,body) values(p_id,auth.uid(),btrim(p_body));
 insert into public.inquiry_changes(inquiry_id,actor_id,action,summary) values(p_id,auth.uid(),'note','내부 메모 추가');
 perform private.record_admin_activity('inquiry.note','inquiry',p_id::text,'내부 메모 추가');
end;$$;
revoke all on function public.admin_add_inquiry_note(uuid,text) from public,anon;
grant execute on function public.admin_add_inquiry_note(uuid,text) to authenticated;

create function public.admin_read_inquiry(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin perform private.require_active_admin();insert into public.inquiry_reads(inquiry_id,user_id) values(p_id,auth.uid()) on conflict(inquiry_id,user_id) do update set read_at=now();end;$$;
revoke all on function public.admin_read_inquiry(uuid) from public,anon;
grant execute on function public.admin_read_inquiry(uuid) to authenticated;

create function public.admin_create_inquiry(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.inquiries%rowtype;v_key text;v_fingerprint text;v_existing private.inquiry_submissions%rowtype;v_request uuid;
begin
 perform private.require_active_admin();
 v_request:=(p_input->>'idempotencyKey')::uuid;
 if v_request is null then raise exception 'invalid_submission';end if;
 v_key:=encode(extensions.digest('manual:'||auth.uid()::text||':'||v_request::text,'sha256'),'hex');
 v_fingerprint:=encode(extensions.digest((p_input-'idempotencyKey')::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(v_key,0));
 select * into v_existing from private.inquiry_submissions where key=v_key;
 if found then
  if v_existing.fingerprint<>v_fingerprint then raise exception 'idempotency_conflict';end if;
  select * into v_row from public.inquiries where id=v_existing.inquiry_id;
  return jsonb_build_object('id',v_row.id,'receiptNumber',v_row.receipt_number);
 end if;
 if not exists(select 1 from public.content_documents where key='policy' and published->>'reviewed'='true' and length(btrim(published->>'inquiryConsent'))>0) then raise exception 'inquiry_policy_unavailable';end if;
 if p_input->>'source' not in ('phone','kakao') or p_input->'consent' is distinct from 'true'::jsonb then raise exception 'invalid_submission'; end if;
 insert into public.inquiries(name,phone,service,region,message,source) values(btrim(p_input->>'name'),p_input->>'phone',p_input->>'service',btrim(p_input->>'region'),btrim(p_input->>'message'),p_input->>'source') returning * into v_row;
 insert into private.inquiry_submissions(key,fingerprint,inquiry_id) values(v_key,v_fingerprint,v_row.id);
 insert into public.inquiry_changes(inquiry_id,actor_id,action,summary) values(v_row.id,auth.uid(),'created','수동 문의 등록');
 perform private.record_admin_activity('inquiry.create','inquiry',v_row.id::text,'수동 문의 등록');
 begin perform private.notify_operators('inquiry.created:'||v_row.id,'inquiry.created','새 문의가 등록되었습니다.','/admin/inquiries/'||v_row.id);exception when others then insert into public.inquiry_changes(inquiry_id,action,summary) values(v_row.id,'notification_failed','운영 알림 생성 실패');end;
 return jsonb_build_object('id',v_row.id,'receiptNumber',v_row.receipt_number);
end;$$;
revoke all on function public.admin_create_inquiry(jsonb) from public,anon;
grant execute on function public.admin_create_inquiry(jsonb) to authenticated;

create function public.read_operator_notifications(p_id uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin perform private.require_active_admin();update public.operator_notifications set read_at=coalesce(read_at,now()) where recipient_id=auth.uid() and (p_id is null or id=p_id);end;$$;
revoke all on function public.read_operator_notifications(uuid) from public,anon;
grant execute on function public.read_operator_notifications(uuid) to authenticated;

create function public.save_operator_notification_settings(p_settings jsonb) returns void language plpgsql security definer set search_path='' as $$
declare v_recipients uuid[];v_events text[];v_channel text;v_config jsonb;v_channels jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role='super_admin') then raise exception 'not_authorized';end if;
 if p_settings->'enabled' is distinct from 'false'::jsonb or p_settings->>'provider'<>'none' then raise exception 'provider_not_connected';end if;
 select coalesce(array_agg(value::uuid),'{}') into v_recipients from jsonb_array_elements_text(p_settings->'recipients');
 if cardinality(v_recipients)>100 or exists(select 1 from unnest(v_recipients) x where not exists(select 1 from public.profiles where id=x and is_active and role in ('admin','super_admin'))) then raise exception 'invalid_recipient';end if;
 select coalesce(array_agg(value),'{}') into v_events from jsonb_array_elements_text(p_settings->'events');
 if not v_events<@array['inquiry.created','inquiry.assigned','operation.failed']::text[] then raise exception 'invalid_event';end if;

 select coalesce(p_settings->'externalChannels',external_channels) into v_channels from public.operator_notification_settings where id;
 foreach v_channel in array array['email','sms','kakao'] loop
  v_config:=v_channels->v_channel;
  if v_config->'enabled' is distinct from 'false'::jsonb or v_config->>'provider' is distinct from 'none' then raise exception 'provider_not_connected';end if;
  if jsonb_typeof(v_config->'recipients') is distinct from 'array' or jsonb_array_length(v_config->'recipients')>100 or exists(select 1 from jsonb_array_elements_text(v_config->'recipients') x where not exists(select 1 from public.profiles where id=x.value::uuid and is_active and role in ('admin','super_admin'))) then raise exception 'invalid_recipient';end if;
  if jsonb_typeof(v_config->'events') is distinct from 'array' or exists(select 1 from jsonb_array_elements_text(v_config->'events') x where x.value not in ('inquiry.created','inquiry.assigned','operation.failed')) or length(coalesce(v_config->>'templateReference',''))>200 then raise exception 'invalid_event';end if;
 end loop;
 update public.operator_notification_settings set recipients=v_recipients,events=v_events,external_channels=v_channels,template_reference=coalesce(p_settings->>'templateReference',''),updated_at=now(),updated_by=auth.uid() where id;
 perform private.record_admin_activity('notification.settings','settings','notifications','운영 알림 수신 설정 변경');
end;$$;
revoke all on function public.save_operator_notification_settings(jsonb) from public,anon;
grant execute on function public.save_operator_notification_settings(jsonb) to authenticated;


create function public.register_inquiry_upload(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin if auth.role()<>'service_role' then raise exception 'not_authorized';end if;insert into private.inquiry_upload_cleanup(storage_path) values(p_path) on conflict do nothing;end;$$;
revoke all on function public.register_inquiry_upload(text) from public,anon,authenticated;
grant execute on function public.register_inquiry_upload(text) to service_role;
create function public.inquiry_upload_cleanup_candidates() returns table(storage_path text) language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized';end if;
 delete from private.inquiry_upload_cleanup j where exists(select 1 from public.inquiry_attachments a where a.storage_path=j.storage_path);
 return query select j.storage_path from private.inquiry_upload_cleanup j where j.eligible_at<now() and not exists(select 1 from public.inquiry_attachments a where a.storage_path=j.storage_path) order by j.created_at limit 20;
end;$$;
revoke all on function public.inquiry_upload_cleanup_candidates() from public,anon,authenticated;
grant execute on function public.inquiry_upload_cleanup_candidates() to service_role;
create function public.finish_inquiry_upload_cleanup(p_paths text[],p_failed boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized';end if;
 if p_failed then update private.inquiry_upload_cleanup set attempts=attempts+1,last_error='storage_cleanup_failed',eligible_at=now()+interval '1 hour' where storage_path=any(p_paths);
 else delete from private.inquiry_upload_cleanup where storage_path=any(p_paths);end if;
end;$$;
revoke all on function public.finish_inquiry_upload_cleanup(text[],boolean) from public,anon,authenticated;
grant execute on function public.finish_inquiry_upload_cleanup(text[],boolean) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('inquiry-attachments','inquiry-attachments',false,10485760,array['image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No client storage policies: upload/read happens through validated server routes. No public or member URL signing.
commit;
