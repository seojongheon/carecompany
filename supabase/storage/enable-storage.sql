-- DEFERRED: Do not place this file under supabase/migrations or run it until plan readiness is approved.
-- Apply in one reviewed transaction after setting NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true only at deployment time.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('case-originals', 'case-originals', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('case-reviewed-public', 'case-reviewed-public', false, 20971520, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "case_originals_admin_select"
on storage.objects for select to authenticated
using (bucket_id = 'case-originals' and (select private.is_active_admin()));

create policy "case_originals_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'case-originals' and (select private.is_active_admin()));

create policy "case_originals_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'case-originals' and (select private.is_active_admin()))
with check (bucket_id = 'case-originals' and (select private.is_active_admin()));

create policy "case_originals_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'case-originals' and (select private.is_active_admin()));

create policy "case_reviewed_public_read"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'case-reviewed-public'
  and exists (
    select 1
    from public.case_media m
    where m.storage_path = name
      and m.is_public = true
      and m.upload_status = 'ready'::public.upload_status
      and (select private.case_is_published(m.case_id))
  )
);

create policy "case_reviewed_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'case-reviewed-public' and (select private.is_active_admin()));

create policy "case_reviewed_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'case-reviewed-public' and (select private.is_active_admin()))
with check (bucket_id = 'case-reviewed-public' and (select private.is_active_admin()));

create policy "case_reviewed_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'case-reviewed-public' and (select private.is_active_admin()));

commit;
