begin;

-- Supabase's public-schema defaults grant API roles all privileges on new
-- relations. These objects are read through RLS and written only by trusted
-- RPCs, so explicitly remove inherited grants (including TRUNCATE, which RLS
-- does not cover). Existing rows, policies, functions and server grants remain.
revoke all privileges on table
  public.admin_activity_feed,
  public.content_documents,
  public.content_document_versions,
  public.case_revision_drafts,
  public.case_revision_history,
  public.media_assets,
  public.media_cleanup_jobs
from public, anon, authenticated;

grant select on table
  public.admin_activity_feed,
  public.content_documents,
  public.content_document_versions,
  public.case_revision_drafts,
  public.case_revision_history,
  public.media_assets,
  public.media_cleanup_jobs
to authenticated;

-- Only trusted activity-writing functions allocate audit IDs.
revoke all privileges on sequence public.admin_activity_logs_id_seq
from public, anon, authenticated;

commit;
