# Supabase image Storage activation

Production-ready Storage is defined by the versioned migrations:

- `20260723000800_enable_case_storage.sql`
- `20260805000100_storage_production_readiness.sql`

Do not run `enable-storage.sql`; it is a historical review artifact and is superseded by the versioned migrations.

## Active model

- `case-originals` is private, limited to 20 MiB, and accepts JPEG, PNG, and WebP inputs. Only active administrators can read, upload, update, or delete objects. HEIC/HEIF stays disabled until a trusted conversion pipeline is available.
- `case-reviewed-public` is private, limited to 20 MiB, and accepts only reviewed WebP output. Visitors can obtain a 30-minute signed URL only when the matching media row is public and ready and its case is published.
- `landing-hero` is private, limited to 20 MiB, and accepts only reviewed WebP output. Visitors can obtain a signed URL only for the path referenced by the current published site content.
- Case and landing inputs are re-encoded as WebP in the browser before the reviewed object is uploaded. Original case files are kept separately; landing uploads keep only the reviewed copy.
- The administrator UI checks JPEG/PNG/WebP magic bytes before upload. Supabase enforces the declared MIME and size at the bucket boundary; authoritative server-side byte sniffing remains separate hardening, so only trusted administrators receive write access.
- `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` enables remote upload, deletion, and signed URL requests only in a production runtime.

## Activation order

1. Keep `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false` in Vercel.
2. Review the linked-project migration list and dry run.
3. Apply `20260805000100_storage_production_readiness.sql` to the linked Supabase project.
4. Run `supabase/tests/database/050_storage_access.test.sql` in a local or staging Supabase environment.
5. Verify an active administrator can upload, preview, publish, and delete a case image and upload/publish a landing image.
6. Verify anonymous users cannot read originals, draft landing images, private media, or media from private/deleted cases.
7. Set `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` in Vercel Production and redeploy.
8. Repeat the public/private access checks against the production URL.

## Object lifecycle

- If reviewed-copy upload fails, the new original is removed.
- Each selected file is persisted independently. A failed file rolls back its own objects; if rollback fails, the UI exposes the affected paths for operator cleanup.
- If case-media persistence fails after upload, both newly created objects are removed.
- Individual photo deletion first removes database references through one transactional RPC, then removes Storage objects. A Storage cleanup failure cannot break a live reference and is merged into a browser-persistent, idempotent retry queue. Scheduled server-side reconciliation remains recommended for cross-device recovery.
- Soft-deleting a case retains its objects for recovery, but RLS stops issuing new public signed URLs.
- Replaced landing images are deleted only after a transactional cleanup claim locks the singleton content row and confirms draft, published content, and version history no longer reference them. Claimed paths remain tombstoned so a concurrent save or restore cannot re-reference a deleted object; failed deletion claims remain retryable.

## Operational checks

1. Confirm an original URL cannot be signed by an anonymous or customer session.
2. Confirm a non-public media row cannot create a reviewed signed URL.
3. Confirm setting `고객 공개`, choosing `대표 사진`, and publishing the case makes only the reviewed image visible.
4. Confirm a draft-only landing image is not visible until the site content is published.
5. Confirm a rejected database deletion leaves Storage untouched, and a later Storage cleanup failure exposes a retry without restoring a stale reference.

## Emergency rollback

Set `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false` in Vercel and redeploy. Do not delete buckets or objects. Existing signed URLs remain valid until their 30-minute expiry.
