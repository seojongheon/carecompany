grant select on public.site_content, public.site_content_versions to authenticated;

create policy site_content_admin_read
on public.site_content for select
to authenticated
using ((select private.is_active_admin()));

create policy site_content_versions_admin_read
on public.site_content_versions for select
to authenticated
using ((select private.is_active_admin()));

create or replace function private.validate_site_content(content jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(content) <> 'object' then
    raise exception using errcode = '23514', message = 'site_content_must_be_object';
  end if;
  if char_length(trim(coalesce(content #>> '{home,title}', ''))) = 0 then
    raise exception using errcode = '23514', message = 'site_content_home_title_required';
  end if;
  if char_length(trim(coalesce(content #>> '{home,heroImageAlt}', ''))) = 0 then
    raise exception using errcode = '23514', message = 'site_content_hero_alt_required';
  end if;
  if coalesce(content #>> '{home,primaryCtaHref}', '') !~ '^/' then
    raise exception using errcode = '23514', message = 'site_content_cta_must_be_internal';
  end if;
end;
$$;

create or replace function public.update_site_content_draft(content jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
begin
  perform private.validate_site_content(content);
  update public.site_content
  set draft = content, updated_by = actor_id, updated_at = now()
  where id = true;
  return content;
end;
$$;

create or replace function public.publish_site_content()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
  current_row public.site_content;
  next_version integer;
  price_item jsonb;
begin
  select * into current_row from public.site_content where id = true for update;
  perform private.validate_site_content(current_row.draft);
  if not exists (select 1 from public.price_items where visible = true) then
    raise exception using errcode = '23514', message = 'visible_price_item_required';
  end if;
  for price_item in select value from jsonb_array_elements(coalesce(current_row.draft -> 'priceItems', '[]'::jsonb))
  loop
    update public.price_items
    set name = coalesce(price_item ->> 'name', name),
        price_label = coalesce(price_item ->> 'priceLabel', price_label),
        conditions = coalesce(array(select jsonb_array_elements_text(price_item -> 'conditions')), conditions),
        visible = coalesce((price_item ->> 'visible')::boolean, visible),
        sort_order = coalesce((price_item ->> 'sortOrder')::integer, sort_order),
        updated_by = actor_id
    where id = (price_item ->> 'id')::uuid;
  end loop;
  insert into public.site_content_versions(version, content, created_by)
  values (current_row.version, current_row.published, actor_id)
  on conflict (version) do nothing;
  next_version := current_row.version + 1;
  update public.site_content
  set published = current_row.draft,
      version = next_version,
      published_by = actor_id,
      updated_by = actor_id,
      published_at = now(),
      updated_at = now()
  where id = true;
  return current_row.draft;
end;
$$;

create or replace function public.restore_site_content_version(version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_active_admin();
  restored jsonb;
begin
  select content into restored from public.site_content_versions where id = version_id;
  if restored is null then raise exception using errcode = 'P0002', message = 'site_content_version_not_found'; end if;
  perform private.validate_site_content(restored);
  update public.site_content
  set draft = restored, updated_by = actor_id, updated_at = now()
  where id = true;
  return restored;
end;
$$;

revoke all on function public.update_site_content_draft(jsonb) from public, anon;
revoke all on function public.publish_site_content() from public, anon;
revoke all on function public.restore_site_content_version(uuid) from public, anon;
grant execute on function public.update_site_content_draft(jsonb) to authenticated;
grant execute on function public.publish_site_content() to authenticated;
grant execute on function public.restore_site_content_version(uuid) to authenticated;
