begin;
create table public.analytics_collection_state(id boolean primary key default true check(id),started_at timestamptz);
insert into public.analytics_collection_state values(true,null);
create table public.analytics_events (
 id uuid primary key,visitor_id uuid not null,session_id uuid not null,path text not null check(length(path)<=240),
 referrer text not null check(length(referrer)<=200),device text not null check(device in ('desktop','mobile','tablet')),
 campaign text,created_at timestamptz not null default now()
);
create index analytics_time_idx on public.analytics_events(created_at);
create table private.analytics_rate_limits(key text primary key,window_start timestamptz not null,hits int not null);
alter table public.analytics_events enable row level security;
alter table public.analytics_collection_state enable row level security;
revoke all on public.analytics_events,public.analytics_collection_state from anon,authenticated;
grant select on public.analytics_collection_state to authenticated;
create policy analytics_state_staff on public.analytics_collection_state for select to authenticated using(private.is_active_admin());
create function public.record_visit_event(event jsonb,rate_key text) returns void language plpgsql security definer set search_path='' as $$
declare hit_count int;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 if event->>'consent' is distinct from 'true' or event->>'path' !~ '^/(|services(/(bathroom|aircon|apartment-window|commercial-window))?|portfolio(/[a-z0-9-]+)?|pricing|about|process|privacy|inquiry|faq|announcements(/[a-z0-9-]+)?)$' or length(rate_key)<>64 then raise exception 'invalid_event'; end if;
 if coalesce(event->>'referrer','') !~ '^[a-zA-Z0-9.-]{1,200}$' or (event->>'campaign' is not null and event->>'campaign' not in ('naver-search','google-search','kakao-channel','instagram','offline')) then raise exception 'invalid_event'; end if;
 insert into private.analytics_rate_limits as r values(rate_key,now(),1) on conflict(key) do update set hits=case when r.window_start < now()-interval '1 minute' then 1 else r.hits+1 end,window_start=case when r.window_start<now()-interval '1 minute' then now() else r.window_start end returning hits into hit_count;
 if hit_count>120 then raise exception 'rate_limit';end if;
 insert into public.analytics_events(id,visitor_id,session_id,path,referrer,device,campaign) values((event->>'eventId')::uuid,(event->>'visitorId')::uuid,(event->>'sessionId')::uuid,event->>'path',event->>'referrer',event->>'device',event->>'campaign') on conflict(id) do nothing;
 update public.analytics_collection_state set started_at=coalesce(started_at,now()) where id;
end;$$;
revoke all on function public.record_visit_event(jsonb,text) from public,anon,authenticated;
grant execute on function public.record_visit_event(jsonb,text) to service_role;
create function public.prune_analytics_events() returns integer language plpgsql security definer set search_path='' as $$
declare deleted_count integer;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 delete from public.analytics_events where created_at<now()-interval '90 days';get diagnostics deleted_count=row_count;
 delete from private.analytics_rate_limits where window_start<now()-interval '1 day';
 return deleted_count;
end;$$;
revoke all on function public.prune_analytics_events() from public,anon,authenticated;
grant execute on function public.prune_analytics_events() to service_role;
create function public.get_visit_report(date_from date,date_to date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_active_admin();
 if date_from is null or date_to is null or date_from>date_to or date_from<(now() at time zone 'Asia/Seoul')::date-89 or date_to>(now() at time zone 'Asia/Seoul')::date then raise exception 'invalid_date_range';end if;
 with events as (select * from public.analytics_events where created_at>=date_from::timestamp at time zone 'Asia/Seoul' and created_at<(date_to+1)::timestamp at time zone 'Asia/Seoul' and created_at>=now()-interval '90 days'),
 days as (select (created_at at time zone 'Asia/Seoul')::date as date,count(*) views,count(distinct visitor_id) visitors,count(distinct session_id) visits from events group by 1),
 pages as (select path,count(*) views from events group by path order by views desc limit 20),
 sources as (select referrer,count(*) views from events group by referrer order by views desc limit 20),
 devices as (select device,count(*) views from events group by device),
 campaigns as (select campaign,count(*) views from events where campaign is not null group by campaign order by views desc)
 select jsonb_build_object('startedAt',(select started_at from public.analytics_collection_state where id),'visitors',count(distinct visitor_id),'visits',count(distinct session_id),'pageViews',count(*),'days',coalesce((select jsonb_agg(days order by date) from days),'[]'::jsonb),'pages',coalesce((select jsonb_agg(pages) from pages),'[]'::jsonb),'sources',coalesce((select jsonb_agg(sources) from sources),'[]'::jsonb),'devices',coalesce((select jsonb_agg(devices) from devices),'[]'::jsonb),'campaigns',coalesce((select jsonb_agg(campaigns) from campaigns),'[]'::jsonb)) into result from events;
 return result;
end;$$;
revoke all on function public.get_visit_report(date,date) from public,anon;
grant execute on function public.get_visit_report(date,date) to authenticated;
commit;
