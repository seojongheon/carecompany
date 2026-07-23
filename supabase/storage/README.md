# Deferred Supabase Storage activation

Storage is intentionally disabled for this release. `enable-storage.sql` is not a migration and must not be included in `supabase db push`.

## Activation gate

1. Confirm the Supabase plan, expected image volume, egress, backup, and deletion requirements.
2. Verify every existing `case_media.storage_path` value is either null or follows the reviewed immutable-path convention.
3. Review the SQL against the current `storage.objects` schema and confirm all eight policies are absent before applying it.
4. Apply `enable-storage.sql` manually in a staging project first, then confirm original objects are inaccessible to anonymous users and reviewed objects are readable only when their case is published.
5. Exercise upload, conversion/EXIF removal, review, publish, unpublish, retry, orphan cleanup, and 20/69-file limits.
6. Set `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` only after the database policy verification succeeds, then redeploy.

## Rollback

Set `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false` and redeploy first. Drop only the policies defined by `enable-storage.sql`; retain buckets and objects until a backup and retention decision is approved. Never delete either bucket as an emergency rollback.

## Validation queries

- `select id, public, file_size_limit, allowed_mime_types from storage.buckets where id in ('case-originals', 'case-reviewed-public');`
- `select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname;`
- Confirm `supabase migration list` contains no entry for `enable-storage.sql`.
