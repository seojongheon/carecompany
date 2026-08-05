# Image Storage Contract

## Case upload

Input:

- authenticated active administrator session
- case identifier
- one or more validated image files

Success:

- returns original and reviewed storage paths for every file
- reviewed output MIME type is WebP
- caller persists both paths in the case media record

Failure:

- returns a stable failure code for disabled storage, selection limit, invalid file, processing failure, or upload failure
- removes objects created by the failed operation where possible
- never reports success with only one of the required objects

## Case media removal

Input:

- authenticated active administrator session
- selected case media references

Success:

- removes associated media references in one database transaction before object cleanup
- removes original and reviewed objects that exist
- refreshes the administrator snapshot

Failure:

- leaves Storage untouched when the transactional database mutation is rejected
- retains failed object cleanup as an idempotent retry without leaving a broken live reference
- returns an actionable administrator message

## Landing hero upload

Input:

- authenticated active administrator session
- one validated image file

Success:

- returns the private reviewed WebP path
- updates the editable draft reference and preview

Public read:

- a signed read URL is available only when the path equals the current published hero path
- draft-only and historical paths are not anonymously readable

Cleanup:

- the database atomically claims and tombstones an unreferenced path while serializing against save, publish, and restore
- Storage deletion runs only after a successful claim
- a failed Storage deletion leaves the tombstone available for retry, and deleted paths cannot be referenced again

## Runtime activation

- `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false`: no remote upload/delete/signed URL request
- `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` and production runtime: Supabase Storage operations enabled
- disabling the flag does not delete existing objects or database references
