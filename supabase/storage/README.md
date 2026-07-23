# Supabase case image Storage

Storage is enabled by the versioned migration `20260723000800_enable_case_storage.sql`.

## Active model

- `case-originals` is private. Only active administrators can upload, inspect, replace, or delete original files.
- `case-reviewed-public` is also private. Administrators can inspect it; a visitor can receive a signed URL only when the matching media row is public, ready, and its case is published.
- The browser re-encodes JPEG, PNG, and WebP uploads as WebP before sending the reviewed file. This removes file metadata from the publicly served copy.
- `case_media.original_storage_path` records the private original. `case_media.storage_path` records the reviewed WebP copy.
- `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` enables the upload path. Restart the application after changing this value.

## Operational checks

1. Confirm that original URLs cannot be read anonymously.
2. Confirm that a non-public media row cannot create a reviewed signed URL.
3. Confirm that setting `고객 공개`, choosing `대표 사진`, and publishing the case makes only the reviewed image visible on the public site.
4. Before permanently deleting a case photo, decide on backup and retention policy. The current screen deletes its database row but does not yet delete the matching Storage objects.

## Emergency rollback

Set `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false` and restart or redeploy. Existing published signed URLs remain valid until their short expiry; do not delete either bucket in an emergency.
