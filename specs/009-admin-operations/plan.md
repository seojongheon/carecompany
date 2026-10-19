# Implementation plan
Approved 2026-10-19. Spec is spec.md. Stack stays Next16/React19/TypeScript/Supabase/Postgres.

## Architecture
- Shared staff helpers validate getUser plus active profile, never trust localStorage or metadata. DB RLS is final boundary. Existing Supabase server client is untyped already.
- Document units use content_documents/content_document_versions with revision CAS and draft/published snapshots. Existing public snapshot shape remains an aggregation for compatibility. Canonical services and prices are published projections updated transactionally.
- Case revisions hold complete manifest; old case tables remain published projection. Trusted RPCs own all writes. Asset safety includes draft/history references.
- Inquiries, private attachments, notes, changes and notifications are separate tables. Public submission server route uses service-only RPC with validation/idempotency/rate gate. Customer read projection excludes internal records.
- Anonymous analytics ingestion is a narrow server route/service-only RPC; consent tracked in browser, anonymous ID and session ID generated after consent. Allowlisted data only; SQL server-time retention and Seoul aggregation.
- Notification provider interface stays disconnected for external providers; config never pretends readiness. Audit immutable and does not copy sensitive payloads.

## Parallel ownership
A: content/site public integration/services/media, migration20261019000200.
B: case revision engine/editor/list/storage safety, migration20261019000300.
C: inquiries/customer routes/notifications/inbox, migration20261019000400.
Root: docs/shared foundation/navigation/analytics/users/settings/audit/dashboard, migrations20261019000100 and20261019000500.
Files shared across domains are coordinated by root. Do not commit or apply remote migrations from workers.

## Shared interfaces
lib/admin/server.ts exports requireStaff(superOnly?:boolean) => {client,context}; throws authorization error when invalid. lib/admin/result.ts normalizes safe errors. Foundation SQL public.admin_activity_logs and private.record_admin_activity(action text,target_type text,target_id text,summary text) are available to later migrations. actor from auth.uid, no sensitive content. Existing private.require_active_admin() / private.is_active_admin() stay available.

## Migration strategy
Additive schema/backfill first; transactionally install RPCs and restrict bypass writes. Preserve existing IDs/status/URLs/objects. New code depends on these migrations; migration errors must be surfaced, never replaced with mock success. Verify local/staging before production. Existing dirty login changes and next-env.d.ts are not overwritten.
