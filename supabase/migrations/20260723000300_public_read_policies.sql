grant select on public.services, public.portfolio_cases, public.case_media, public.case_videos, public.tags, public.case_tags, public.price_items to anon, authenticated;
grant insert, update, delete on public.services, public.portfolio_cases, public.case_media, public.case_videos, public.tags, public.case_tags, public.price_items to authenticated;

create or replace function private.case_is_published(case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio_cases c
    where c.id = case_id
      and c.status = 'published'::public.case_status
      and c.published_at is not null
  )
$$;

create or replace function private.has_public_ready_cover(case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.case_media m
    where m.case_id = case_id
      and m.is_cover = true
      and m.is_public = true
      and m.upload_status = 'ready'::public.upload_status
  )
$$;

revoke all on function private.case_is_published(uuid) from public, anon, authenticated;
revoke all on function private.has_public_ready_cover(uuid) from public, anon, authenticated;
grant execute on function private.case_is_published(uuid), private.has_public_ready_cover(uuid) to anon, authenticated;

create policy services_public_read
on public.services for select
to anon, authenticated
using (active = true);

create policy services_admin_all
on public.services for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy portfolio_cases_public_read
on public.portfolio_cases for select
to anon, authenticated
using (
  status = 'published'::public.case_status
  and published_at is not null
  and (select private.has_public_ready_cover(id))
);

create policy portfolio_cases_admin_all
on public.portfolio_cases for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy case_media_public_read
on public.case_media for select
to anon, authenticated
using (
  is_public = true
  and upload_status = 'ready'::public.upload_status
  and (select private.case_is_published(case_id))
);

create policy case_media_admin_all
on public.case_media for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy case_videos_public_read
on public.case_videos for select
to anon, authenticated
using (
  is_public = true
  and (select private.case_is_published(case_id))
);

create policy case_videos_admin_all
on public.case_videos for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy tags_public_read
on public.tags for select
to anon, authenticated
using (active = true);

create policy tags_admin_all
on public.tags for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy case_tags_public_read
on public.case_tags for select
to anon, authenticated
using (
  (select private.case_is_published(case_id))
);

create policy case_tags_admin_all
on public.case_tags for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy price_items_public_read
on public.price_items for select
to anon, authenticated
using (visible = true);

create policy price_items_admin_all
on public.price_items for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create or replace function public.get_published_site_content()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select sc.published || jsonb_build_object(
    'priceItems', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'serviceKey', p.service_key,
          'name', p.name,
          'priceLabel', p.price_label,
          'conditions', p.conditions,
          'visible', p.visible,
          'sortOrder', p.sort_order
        ) order by p.sort_order, p.id
      )
      from public.price_items p
      where p.visible = true
    ), '[]'::jsonb),
    '_publication', jsonb_build_object('version', sc.version, 'publishedAt', sc.published_at)
  )
  from public.site_content sc
  where sc.id = true
$$;

create or replace function public.list_public_portfolio_cases(
  service_key text default null,
  tag_keys text[] default null,
  page_limit integer default 24,
  cursor_published_at timestamptz default null,
  cursor_id uuid default null
)
returns setof jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'case', to_jsonb(c),
    'service', to_jsonb(s),
    'coverMedia', to_jsonb(m),
    'publicMediaCount', (select count(*) from public.case_media cm where cm.case_id = c.id),
    'tags', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sort_order, t.id)
      from public.case_tags ct join public.tags t on t.id = ct.tag_id
      where ct.case_id = c.id
    ), '[]'::jsonb)
  )
  from public.portfolio_cases c
  join public.services s on s.id = c.service_id
  join lateral (
    select cm.* from public.case_media cm
    where cm.case_id = c.id and cm.is_cover = true
    order by cm.sort_order, cm.id limit 1
  ) m on true
  where (service_key is null or s.key = service_key)
    and (tag_keys is null or not exists (
      select 1 from unnest(tag_keys) requested(key)
      where not exists (
        select 1 from public.case_tags ct join public.tags t on t.id = ct.tag_id
        where ct.case_id = c.id and t.key = requested.key
      )
    ))
    and (cursor_published_at is null or (c.published_at, c.id) < (cursor_published_at, cursor_id))
  order by c.featured_rank asc nulls last, c.published_at desc, c.id desc
  limit least(greatest(page_limit, 1), 100)
$$;

create or replace function public.get_public_portfolio_case(case_slug text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'case', to_jsonb(c),
    'service', to_jsonb(s),
    'media', coalesce((select jsonb_agg(to_jsonb(m) order by m.sort_order, m.id) from public.case_media m where m.case_id = c.id), '[]'::jsonb),
    'videos', coalesce((select jsonb_agg(to_jsonb(v) order by v.sort_order, v.id) from public.case_videos v where v.case_id = c.id), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(to_jsonb(t) order by t.sort_order, t.id) from public.case_tags ct join public.tags t on t.id = ct.tag_id where ct.case_id = c.id), '[]'::jsonb)
  )
  from public.portfolio_cases c
  join public.services s on s.id = c.service_id
  where c.slug = case_slug
$$;

revoke all on function public.get_published_site_content() from public;
revoke all on function public.list_public_portfolio_cases(text, text[], integer, timestamptz, uuid) from public;
revoke all on function public.get_public_portfolio_case(text) from public;
grant execute on function public.get_published_site_content() to anon, authenticated;
grant execute on function public.list_public_portfolio_cases(text, text[], integer, timestamptz, uuid) to anon, authenticated;
grant execute on function public.get_public_portfolio_case(text) to anon, authenticated;
