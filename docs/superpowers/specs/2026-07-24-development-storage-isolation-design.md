# Development Storage Isolation Design

## Goal

Prevent every Supabase Storage upload, signed URL read, and delete request while the application runs through `next dev`, even when `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true`.

## Environment Policy

- Development and test environments never access Supabase Storage.
- Production accesses Supabase Storage only when `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true`.
- Supabase database and authentication behavior remain unchanged.
- An explicitly injected local portfolio repository continues to use the existing local mock persistence behavior.

## Runtime Boundary

Add a single pure policy function that receives the public Storage flag and the current Node environment. It returns `true` only for enabled production environments.

The upload runtime distinguishes four states:

- `supabase`: production with Storage enabled
- `development`: development or test; session-only simulated upload
- `deferred`: production with Storage disabled
- `mock`: explicitly injected local repository

## Storage Operations

### Upload

The upload panel uses the runtime policy before constructing a Storage gateway. Development selections receive local object URL previews and simulated progress, but are not persisted to Storage.

### Read

The media URL hook excludes all Storage paths from its request in development. Portfolio cards, quick views, galleries, lightboxes, and the admin photo manager therefore use their existing service-specific mock asset fallback without requesting signed URLs.

### Delete

The admin photo manager applies the same runtime policy before issuing removal requests for originals or reviewed files. Development deletion changes application metadata only and never calls a Storage bucket.

## User Feedback

The upload panel states that development mode uses session-only previews and does not access Supabase Storage. Production and disabled-production messages retain their existing meaning.

## Testing

- Unit tests prove development is locked even when the public Storage flag is enabled.
- Unit tests prove enabled production still selects the Supabase runtime.
- A hook test proves development media rendering never constructs a Storage request.
- Existing upload, media, repository, and public browsing tests remain green.
- Type checking, linting, and a production build must pass.

## Non-Goals

- Disabling Supabase database access
- Disabling Supabase authentication
- Removing stored Storage paths from database rows
- Deleting existing Storage objects
