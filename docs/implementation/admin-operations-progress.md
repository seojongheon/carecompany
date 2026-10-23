# SDD ledger — plan: specs/009-admin-operations/plan.md
2026-10-19: User approved comprehensive plan. Existing branch had only login redirect changes and next-env; preserved. Feature branch codex/admin-operations created in existing checkout to keep those authorized changes available. No remote mutations had occurred at preflight; later deployment preparation is recorded below.

## Preflight
|Tasks|Shared contract|Decision|
|T002/T003/T005/T008/T011|staff authorization/audit|Root supplies shared helper and foundation SQL first; workers own later migration numbers|
|T003/T005/T007|media references|Cross-domain deletion must consult all draft/published/history references|
|T008/T009/T012|notifications/dashboard|Inquiry worker exports components/server queries; root integrates layout/dashboard|
|T003/T010|settings content|settings document master-only; root settings embeds document editor|
|T001-T015|Spec consistency|Approved scope mapped across all tasks; no provider send or arbitrary service taxonomy|

T001: documents saved. Remaining work tracked in tasks.md and worker reports. No completion claims without verification.

## Verified implementation and release preparation — 2026-10-19

- T001–T012: implementation and local regression work completed. Deployment and authenticated verification evidence are recorded below.
- Latest integrated test run started at 16:45:47 and passed all 248 tests across 59 files. Final typecheck, full lint and diff checks passed. The first production build was blocked by sandbox port restrictions; the elevated rerun passed compilation/type checking and generated all 35 static pages.
- Isolated PostgreSQL verification passed: all 16 migrations, 93 database assertions and content/media SQL regressions.
- Linked database dry run listed only the five new migrations. The transactional migration rehearsal preserved the existing 2 cases, 20 photos and published content, then rolled back successfully. No reset or seed was applied.
- Actual linked application completed: the five feature migrations and the 006 custom conflict SQLSTATE correction are applied, bringing the remote total to 16 migrations. Existing 2 cases and 20 photos are preserved, and every Storage bucket remains private.
- Final Production master-account read checks passed for 7 pages at 1440/390 viewport sizes (14 checks, exit 0), separately from the two master-password E2E scenarios skipped for missing credentials. Each page reached networkidle with no error alerts; the desktop dashboard screenshot also passed visual inspection.
- Final authenticated E2E completed in 1.3 minutes: 24 passed / 2 skipped out of 26 scenarios. Actual uploads, publication with prior public output preserved, restore, the 69-photo limit and stale-revision conflicts passed at both viewports. The six inquiry scenarios exercised the unpublished-policy blocking branch; successful end-to-end inquiry submission is not claimed.
- The remaining case conflict-recovery issue is resolved: a failed reload no longer creates a stale comparison, and a successful retry compares the fresh snapshot. The previously failing independent reproduction now passes.
- Server-only `SUPABASE_SECRET_KEY` and `CRON_SECRET` were registered successfully in Vercel production and preview. Secret values are not recorded here.
- Test-data cleanup completed with cleanup-e2e.mjs: the one remaining test case was moved to trash, no test announcements remain awaiting cleanup, and three test accounts were changed to inactive customers. Existing 2 cases retain their slugs/statuses and all 20 photo Storage paths. Post-cleanup counts confirm 1 active master, 0 public buckets and 16 migrations.
- T013–T015 are complete: authenticated E2E evidence, migration validation, linked dry run/application, release/rollback instructions and final Production checks are recorded.
- Production deployment `dpl_GptyQ7kX8K55G4quVTE8pT9SQ9fx` is READY at [the deployment URL](https://carecompany-xiwj-ebywdrhrp-sjh47921-2226s-projects.vercel.app). The [canonical production alias](https://carecompany-xiwj.vercel.app) is confirmed to map to this deployment ID.
- Production remote checks passed 17 assertions: 12 public routes returned 200, anonymous admin access redirected to login, maintenance returned 401 without authorization and 200 with authorization, consent=false analytics returned 400, and invalid inquiry input returned 400.
- Follow-up after operational policy setup: successful inquiry submission, receipt, member inquiry projection and staff processing still require a live E2E run after the master reviews and publishes the actual consent policy. This release verified the unpublished-policy blocking branch and did not publish a placeholder policy.

Detailed evidence: [verification record](../verification/admin-operations.md). Release and rollback procedure: [release guide](../operations/admin-operations-release.md).
