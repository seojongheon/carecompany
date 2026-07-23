# Deferred Backend and Production Integration Checklist

**Purpose:** Preserve every temporary frontend-only decision that must be replaced or verified
before production deployment.  
**Current milestone:** Supabase Auth/PostgreSQL/RLS connected; Storage and production operations deferred
**Last reviewed:** 2026-07-23

No unchecked item in this document may be treated as production-ready.

## Current replacement map

| Temporary concern | Current path to replace or retain behind an adapter |
|---|---|
| Repository contract | `features/portfolio/repository/portfolio-repository.ts` |
| Browser persistence/recovery | `features/portfolio/repository/local-storage-portfolio-repository.ts` |
| Public privacy filtering | `features/portfolio/selectors/portfolio-selectors.ts` |
| Client provider and mutation states | `features/portfolio/repository/portfolio-provider.tsx` |
| Session-only file previews | `features/uploads/model/session-preview-manager.ts` |
| Uppy queue without transport | `features/uploads/model/uppy-queue.ts` |
| Simulated upload | `features/uploads/model/simulated-upload.ts` |
| Client publish validation | `features/publishing/model/publish-validator.ts` and `features/portfolio/repository/local-storage-portfolio-repository.ts` |
| Mock customer authentication | `features/auth/repository/browser-auth-repository.ts` |
| Client administrator lock | `components/admin/admin-auth-guard.tsx` and all routes under `app/admin/` |
| Seed/mock media | `features/portfolio/data/seed.ts` and `public/mock-media/` |
| Planned site-content drafts and publish snapshots | `specs/002-admin-site-content-management/spec.md` |

Keep the repository interface as the UI seam where practical. Authentication, authorization,
RLS, storage policies, and trusted publish validation must remain server-controlled even if the
visible components are reused.

## 1. Authentication and authorization

- [x] Replace the customer browser adapter with Supabase Auth while preserving the repository contract.
- [x] Enforce server-side session and role checks for every `/admin` route and trusted mutation.
- [ ] Create the initial super administrator through a reviewed deployment runbook; never seed credentials in source, public environment variables, or browser storage.
- [x] Let only `super_admin` grant or revoke `admin` on existing customer accounts and record an immutable audit trail.
- [x] Create customer profiles automatically and reject inactive/non-admin authenticated users from administrator operations.
- [ ] Add secure logout, session expiry, reauthentication, and draft recovery flows.
- [ ] Add tests proving anonymous and non-admin users cannot read or mutate administrator data.
- [ ] Add rate limiting, generic authentication errors, secure password reset, and account-enumeration protections.

**Current substitute:** Supabase Auth and server/RLS authorization are active. No administrator or
super-administrator credential exists yet; SMTP, CAPTCHA/rate limits, and production session operations remain deployment gates.
**Completion evidence:** Auth configuration, server guard tests, and E2E access-control results.

## 2. Database and migrations

- [x] Convert mock entities into Postgres tables and reviewed SQL migrations.
- [x] Seed the four canonical PRD services with stable keys and slugs.
- [x] Add constraints for unique slugs, 69-media maximum, three-video maximum, cover ownership,
  ordering, and publish prerequisites.
- [x] Generate Supabase database TypeScript types and add Supabase-backed repository DTO mappings.
- [ ] Define backup, rollback, and migration verification procedures.
- [x] Add site settings, page content, price items, and content-version storage with
  draft/published separation and protected canonical service keys.

**Current substitute:** Supabase PostgreSQL is active; site-media binary storage remains deferred.
**Completion evidence:** Migration files, generated types, schema tests, and rollback exercise.

## 3. RLS and privacy boundary

- [x] Enable RLS on every public-schema table.
- [x] Permit anonymous reads only for published cases and ready public media/videos.
- [x] Restrict all mutations to active administrators.
- [ ] Confirm private/deleted cases are absent from lists, counts, related content, direct URLs,
  sitemap, cache, and storage access.
- [ ] Add automated RLS tests for anonymous, authenticated non-admin, inactive admin, and admin.

**Current substitute:** Remote RLS is active and the anonymous verification script confirms drafts/profiles are denied.
**Completion evidence:** SQL policies and passing adversarial RLS test suite.

## 4. Image storage and processing

- [ ] Create private original and reviewed public image buckets with scoped policies.
- [ ] Add the Uppy TUS transport to the existing Uppy Core queue and connect it directly to
  approved storage endpoints.
- [ ] Validate file count, size, MIME, and actual format on both client and trusted server paths.
- [ ] Convert HEIC/HEIF, strip EXIF, produce web-ready derivatives, and preserve dimensions.
- [ ] Use immutable UUID/versioned public paths and prevent original file exposure.
- [ ] Make partial failure, resume, retry, cleanup, and orphan reconciliation operational.
- [ ] Revoke public access or remove public derivatives immediately when media/case is private.

**Current substitute:** Storage is fail-closed in the Supabase repository. Local mock tests retain
session previews; production displays a connection-waiting state and makes no Storage request.
**Completion evidence:** Storage policies, processing job tests, mobile interruption E2E, and
privacy inspection of generated files.

## 5. Server validation and publish transaction

- [ ] Move authoritative Zod validation and publish checks to trusted server operations.
- [ ] Make publication atomic across metadata, media readiness, public derivatives, and status.
- [ ] Prevent duplicate save/publish requests and resolve concurrent edits.
- [ ] Add server-side YouTube URL normalization and content length limits.
- [ ] Record privacy reviewer identity and timestamp.
- [ ] Make whole-site content publication atomic so customers never see a partially published
  home, service, pricing, process, about, privacy, or shared-settings update.
- [ ] Validate required content, alt text, safe links, section visibility, and in-use media before
  publishing or deletion.
- [ ] Record site-content editor/publisher identity, version history, and restore provenance.

**Current substitute:** Browser validation and local atomic JSON replacement.  
**Completion evidence:** Server contract tests, concurrency tests, and failed-publication rollback.

## 6. Rendering, cache, and SEO

- [ ] Read public data on the server and remove dependence on client browser state.
- [ ] Generate unique title, description, canonical, Open Graph, breadcrumb, service, image,
  and video metadata for real published content.
- [ ] Generate a sitemap containing only public routes and exclude filter/admin/private routes.
- [ ] Implement cache tags and invalidation for home, service, list, detail, related cases,
  and sitemap after publish/unpublish/edit.
- [ ] Verify direct URLs for private, deleted, and unknown cases return indistinguishable 404s.
- [ ] Measure LCP, CLS, and INP with representative production images and mobile networking.

**Current substitute:** Server-rendered seed content plus client-side local overrides.  
**Completion evidence:** Metadata snapshots, sitemap inspection, cache tests, and Web Vitals report.

## 7. Observability and analytics

- [ ] Configure Sentry without sending customer photos, filenames, addresses, or contact data.
- [ ] Configure Vercel Analytics events for approved customer interactions only.
- [ ] Monitor upload failure rate, publish errors, media failures, server errors, and Web Vitals.
- [ ] Configure retention, alert owners, and incident-response links.

**Current substitute:** Local UI error states only.  
**Completion evidence:** Sanitized test events, alert exercise, and privacy review.

## 8. Real content and business configuration

- [ ] Replace the logo slot with the approved logo and reconcile brand tokens.
- [ ] Replace sample price copy with approved service prices and conditions.
- [ ] Add verified representative, business registration, contact, address, and privacy-policy data.
- [ ] Import reviewed real cases with safe location display, captions, and alt text.
- [ ] Obtain confirmation that every published photo/video may be publicly used.
- [ ] Review the administrator-managed home, services, pricing, process, about, privacy, shared
  settings, and media library before enabling production publication.

**Current substitute:** Explicit placeholders and non-identifying Korean seed content.  
**Completion evidence:** Content owner sign-off and production content audit.

## 9. Deployment and search registration

- [ ] Configure production/staging environments, domain, secrets, and preview isolation.
- [ ] Prevent production secrets from entering browser bundles or repository history.
- [ ] Run lint, typecheck, unit/component tests, RLS tests, E2E, accessibility checks, and build
  against the production configuration.
- [ ] Register and verify Google Search Console and Naver search tools.
- [ ] Define rollback, data backup, uptime check, and incident ownership.

**Current substitute:** Local development only.  
**Completion evidence:** Deployment runbook, successful release verification, registrations,
rollback rehearsal, and production approval.

## 10. Mock-to-production migration

- [ ] Decide whether browser mock data is discarded or exported through a one-time reviewed tool.
- [ ] Never migrate object URLs, placeholder media keys, or unreviewed sample content.
- [ ] Map mock IDs/slugs to production UUIDs and preserve only approved canonical URLs.
- [ ] Remove local persistence recovery UI from production or retain it only for safe drafts.
- [ ] Replace the local repository adapter while preserving UI-facing contracts or document
  approved contract changes.
- [ ] Delete mock-only controls and verify no seed/private demo data ships unintentionally.

**Current substitute:** `LocalStoragePortfolioRepository` and seeded records.  
**Completion evidence:** Signed migration plan, rehearsal results, data diff, and production audit.
