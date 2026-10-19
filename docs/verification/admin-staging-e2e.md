# Authenticated administrator E2E

`playwright.admin.config.ts` is a separate, explicitly authorized operations suite. The default Playwright config excludes these files. It does not load `.env`, start a server, reset a database, create accounts, or use a service role key.

Point the suite at a prepared staging deployment or the explicitly authorized linked Supabase/Vercel environment, with all operations migrations applied. Supply explicit application/backend URLs and active test administrator credentials. No app `.env` credentials are imported. Photo-publication scenarios run only with `E2E_CASE_STORAGE_READY=true`; tests never enable storage or change bucket visibility. Only UUID-prefixed test cases, independent announcements, and synthetic inquiries are created. Teardown moves test cases to trash, hides the test announcement, and closes/unassigns test inquiries. Their history/files are preserved. Shared home, pricing, and policy documents are never modified. If the existing consent policy is unpublished or unreviewed, inquiry scenarios verify that the public form is disabled and the manual RPC rejects submission without creating a row. They never publish or edit that shared policy.

Required environment variables:

- Either `E2E_TARGET_ENV=staging` with `E2E_ALLOW_STAGING_WRITES=true`
- Or `E2E_TARGET_ENV=linked` with `E2E_ALLOW_LINKED_WRITES=true` for the user-authorized linked environment
- `E2E_BASE_URL`: the explicit target application origin
- `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY`: that same target backend
- `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`: an active test administrator

Optional photo publication requires `E2E_CASE_STORAGE_READY=true`; absent that flag, those scenarios skip with an explicit storage-not-ready reason.

Optional role scenarios require `E2E_CUSTOMER_EMAIL/PASSWORD`, `E2E_SUPER_ADMIN_EMAIL/PASSWORD`, and `E2E_SUSPENDED_EMAIL/PASSWORD`. Use a pre-suspended test administrator for the final pair. Credentials are supplied by the operator's environment; do not commit them or put passwords in shell history.

Run:

```sh
node node_modules/@playwright/test/cli.js test --config=playwright.admin.config.ts
```

The suite signs in through the actual UI and covers:

- Cases: create/save/reload/search, real compare-and-swap conflict, failed-save input retention, privacy-gated image publication, preservation of live output while a draft is edited, republish, trash/private restore, and 20/69/3 limits.
- Documents: one uniquely keyed announcement saved as a draft, published, edited again without changing its public page, and hidden through its editor. No shared content is edited.
- Inquiries: public guest submission, receipt, staff assignment/internal note/completion, plus optional authenticated customer submission and the customer-safe “내 문의” projection. The member view must omit the internal note and assignee.
- Idempotency: repeat a synthetic manual-inquiry RPC with the same key and payload, verify one row/receipt, then reject a changed payload using that key.
- Roles: anonymous/customer access rejection, optional master access, and suspended-staff rejection.

 Browser Supabase requests to any backend other than the explicitly configured target origin are blocked and fail the test. Desktop 1440 and mobile 390 projects save screenshots in their test output folders; no traces or videos persist sign-in credentials.

## Linked environment result — 2026-10-19

The explicitly authorized linked run completed in 1.3 minutes: **24 passed / 2 skipped out of 26 scenarios** across desktop 1440 and mobile 390. Actual uploads, publication with the prior public output preserved during edits, restore, the 69-photo limit and stale-revision conflicts passed at both viewports. The two skipped scenarios require master-password credentials; separate final Production master-account checks passed for 7 pages at 1440/390 sizes (14 read checks, exit 0). Each reached networkidle with no error alerts, and the desktop dashboard screenshot passed visual inspection.

The six inquiry scenarios took the unpublished-policy branch. They verified that public/manual submission is blocked while the shared policy remains unpublished. This run does **not** establish successful end-to-end inquiry submission, receipt creation or post-submission processing. The shared policy was not changed for testing. After the master reviews and publishes the actual policy, run the successful inquiry flow through receipt, member inquiry view and staff processing as an operational follow-up.

Cleanup completed with cleanup-e2e.mjs: the one remaining test case was moved to trash, no test announcements remain awaiting cleanup, and three test accounts were changed to inactive customers. The original 2 cases retain their slugs/statuses and all 20 photo Storage paths. The environment retains 1 active master, 0 public buckets and 16 applied migrations.

The final Production deployment is READY, its canonical alias maps to the new deployment, and 17 public/API checks plus all 14 final master-account screen checks passed. See the [operations verification record](admin-operations.md) for the deployment identity and complete evidence.
