begin;
create table public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(action) between 1 and 80),
  target_type text not null check (length(target_type) between 1 and 80),
  target_id text not null check (length(target_id) between 1 and 200),
  summary text not null check (length(summary) <= 500),
  result text not null default 'success' check (result in ('success','failure')),
  reason text check (length(reason)<=500),
  created_at timestamptz not null default now()
);
create index admin_activity_created_idx on public.admin_activity_logs(created_at desc);
alter table public.admin_activity_logs enable row level security;
revoke all on public.admin_activity_logs from anon, authenticated;
grant select on public.admin_activity_logs to authenticated;
create policy activity_master_read on public.admin_activity_logs for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active));
create function private.record_admin_activity(action text,target_type text,target_id text,summary text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.admin_activity_logs(actor_id,action,target_type,target_id,summary) values(auth.uid(),action,target_type,target_id,left(summary,500));
end;$$;
revoke all on function private.record_admin_activity(text,text,text,text) from public,anon,authenticated;
create function private.prevent_activity_mutation() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'audit_is_immutable'; end; $$;
create trigger activity_immutable before update or delete on public.admin_activity_logs for each row execute function private.prevent_activity_mutation();

-- Paginated account management; no profile table bypass is granted.
create function public.search_admin_profiles(search_text text default '',role_filter text default '',active_filter text default '',date_from date default null,date_to date default null,page_number integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_active_super_admin();
 with selected as(select p.* from public.profiles p where (search_text='' or p.email ilike '%'||search_text||'%' or p.display_name ilike '%'||search_text||'%') and (role_filter='' or p.role::text=role_filter) and (active_filter='' or p.is_active=(active_filter='active')) and (date_from is null or p.created_at>=date_from::timestamp at time zone 'Asia/Seoul') and (date_to is null or p.created_at<(date_to+1)::timestamp at time zone 'Asia/Seoul')),
 paged as(select * from selected order by created_at desc,id offset (greatest(1,least(page_number,10000))-1)*20 limit 20)
 select jsonb_build_object('items',coalesce((select jsonb_agg(paged) from paged),'[]'::jsonb),'total',(select count(*) from selected)) into result;
 return result;
end;$$;
revoke all on function public.search_admin_profiles(text,text,text,date,date,integer) from public,anon;
grant execute on function public.search_admin_profiles(text,text,text,date,date,integer) to authenticated;

-- Master accounts are managed only through the operations runbook, even when more than one exists.
create function private.protect_master_role_changes() returns trigger language plpgsql set search_path='' as $$
begin
 if old.role='super_admin' and auth.uid() is not null and (new.role<>old.role or new.is_active<>old.is_active) then raise exception 'master_changes_require_operations' using errcode='42501';end if;
 return new;
end;$$;
create trigger protect_master_changes before update on public.profiles for each row execute function private.protect_master_role_changes();

-- The union retains each source's RLS, including the master-only read boundary.
create view public.admin_activity_feed with (security_invoker=true) as
 select 'operation:'||id::text as id,actor_id,action,target_type,target_id,summary,result,reason,created_at from public.admin_activity_logs
 union all
 select 'role:'||id::text,actor_id,'member_access_changed','member',target_id::text,
  previous_role::text||' → '||new_role::text||case when new_active then ' · 활성' else ' · 정지' end,
  'success',reason,created_at from public.admin_role_audit_logs;
grant select on public.admin_activity_feed to authenticated;
create function private.record_admin_activity(action text,target_type text,target_id text,summary text,result text,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.admin_activity_logs(actor_id,action,target_type,target_id,summary,result,reason) values(auth.uid(),action,target_type,target_id,left(summary,500),result,left(reason,500));
end;$$;
revoke all on function private.record_admin_activity(text,text,text,text,text,text) from public,anon,authenticated;
commit;
