# Quickstart Validation Guide

## Prerequisites

- Node.js 24 LTS
- pnpm
- A Chromium-based browser for manual checks

## Setup and checks

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` and use a clean browser profile for the seeded state.

Run the complete automated verification set:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Expected: every command exits with code 0. The E2E runner starts the production-compatible
test server defined in Playwright configuration.

## Scenario A: Customer browse and history

1. Open `/` at 390px and confirm the four PRD service cards appear in a 2x2 layout.
2. Open 화장실 청소, select a filter, and record the URL query.
3. Open a case card. Confirm `/portfolio/[slug]` appears while the list remains behind a
   full-screen quick view.
4. Press Back. Confirm the modal closes and the filter, scroll position, and card focus remain.
5. Open the same URL in a new tab. Confirm a full detail page appears.
6. Open a gallery photo and verify lightbox count, caption, keyboard arrows, swipe, and close.

## Scenario B: Private data boundary

1. Open `/admin/portfolio` directly without login.
2. Create a new draft and keep it private.
3. Confirm it does not appear on home, service, portfolio, related cases, or direct customer URL.
4. Complete required metadata, public media, and all privacy checks; publish it.
5. Confirm it appears in the correct public service and detail views.
6. Unpublish it and confirm immediate removal from every customer view.

## Scenario C: Persistence and session media

1. Edit a case title, service, tags, and visibility; reload and confirm those values remain.
2. Select valid image files and confirm previews and simulated progress appear.
3. Reload and confirm text metadata remains while selected file previews use mock fallback media.
4. Corrupt the browser storage value through DevTools, reload, and confirm seed recovery plus a
   recovery notification.

## Scenario D: Upload boundaries

1. Select 21 files in one batch and confirm the operation is blocked before progress starts.
2. Fill a case to 69 media items and confirm add controls become disabled.
3. Simulate one failed item and confirm successful items remain while only the failed item can
   retry or be removed.
4. Verify invalid type and oversized file messages identify the problem and next action.

## Responsive and accessibility review

- Review home, service, quick view, detail, pricing, admin list, edit, upload progress, and
  publish checklist at 390x844 and 1440x900.
- Tab through header, filters, cards, dialogs, lightbox, and forms without a mouse.
- Confirm 44x44 minimum targets, visible focus, dialog focus trap/return, reduced motion, and
  status text beyond color.
- Compare visual hierarchy and tokens with `design/hygiene-tech__*.pdf`; resolve content
  conflicts in favor of the PRD.

## Deferred production readiness

Before any deployment claim, review `docs/project/deferred-backend-integration.md`. Every
security, persistence, storage, SEO, observability, content, and deployment checkbox must be
completed with linked evidence in a future backend milestone.
