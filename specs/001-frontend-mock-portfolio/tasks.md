# Tasks: 위생의 기술 프런트엔드 목업 포트폴리오

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Implementation owner**: Superpowers executes this approved task contract with TDD,
review, and verification. Spec Kit does not implement production code.

**Tests**: Mandatory. For every behavior task, create the focused failing test first,
confirm the intended failure, implement the minimum change, and keep the test green while
refactoring.

## Phase 1: Setup

**Purpose**: Create one testable Next.js application and its quality tooling.

- [x] T001 Initialize the Next.js 16.2.x App Router project with TypeScript strict mode, Node.js 24 LTS, pnpm, Tailwind CSS 4, lint/typecheck/test/e2e scripts, and dependency pins in `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, and `eslint.config.mjs`
- [x] T002 [P] Configure Vitest, React Testing Library, jsdom, and axe helpers in `vitest.config.ts`, `tests/setup.ts`, and `tests/helpers/render.tsx`
- [x] T003 [P] Configure Playwright desktop/mobile projects and production-compatible web server commands in `playwright.config.ts` and `tests/e2e/fixtures.ts`
- [x] T004 [P] Create the application root, Korean metadata defaults, Noto Sans KR/Pretendard fallback stack, skip link, and base CSS token imports in `app/layout.tsx` and `app/globals.css`
- [x] T005 Document local setup, verification commands, PRD authority, Spec Kit/Superpowers ownership, and frontend-only warnings in `README.md`

**Checkpoint**: The empty app starts, and the test/lint/typecheck/build commands are defined.

---

## Phase 2: Foundational Contracts and State

**Purpose**: Establish domain contracts, deterministic seed content, browser persistence,
public privacy selectors, and reusable UI primitives. These tasks block every user story.

- [x] T006 [P] Write failing schema tests for four service keys, unique slugs, private draft defaults, public media readiness, 20/69 limits, three-video limit, and JSON-safe storage in `tests/unit/portfolio-schemas.test.ts`
- [x] T007 Implement domain types and Zod schemas that satisfy T006 in `features/portfolio/model/types.ts` and `features/portfolio/model/schemas.ts`
- [x] T008 [P] Write failing seed-data tests for canonical PRD services, realistic Korean content, public/private mixtures, stable featured ordering, and sufficient list density in `tests/unit/seed-data.test.ts`
- [x] T009 Create immutable service/tag/case/media/video seed fixtures and placeholder asset mappings that satisfy T008 in `features/portfolio/data/seed.ts` and `public/mock-media/README.md`
- [x] T010 Write failing repository contract tests for snapshot isolation, subscriptions, CRUD, publish atomicity, unpublish visibility, corruption recovery, and reset in `tests/unit/local-storage-portfolio-repository.test.ts`
- [x] T011 Implement `PortfolioRepository`, the versioned `LocalStoragePortfolioRepository`, recovery notification, and public/admin selectors that satisfy T010 in `features/portfolio/repository/portfolio-repository.ts`, `features/portfolio/repository/local-storage-portfolio-repository.ts`, and `features/portfolio/selectors/portfolio-selectors.ts`
- [x] T012 Write failing provider tests for stable server snapshot hydration, one mutation notification, no hydration mismatch, storage failure retention, and repository reset in `tests/component/portfolio-provider.test.tsx`
- [x] T013 Implement the portfolio provider, hooks, mutation status, and recovery toast bridge that satisfy T012 in `features/portfolio/repository/portfolio-provider.tsx` and `features/portfolio/repository/use-portfolio.ts`
- [x] T014 [P] Write failing tests for file MIME/size/count validation, simulated partial progress, failure retry, session-only previews, and object URL revocation in `tests/unit/session-preview-manager.test.ts`
- [x] T015 Implement Uppy Core queue configuration without a transport plugin, 20MB/file and 20/69 count constraints, session preview lifecycle, and deterministic failure simulation that satisfy T014 in `features/uploads/model/uppy-queue.ts`, `features/uploads/model/upload-constraints.ts`, `features/uploads/model/session-preview-manager.ts`, and `features/uploads/model/simulated-upload.ts`
- [x] T016 [P] Write failing tests for supported YouTube watch/short/Shorts URLs, invalid URLs, canonical service/case route builders, query ordering, and cursor encoding in `tests/unit/youtube-routes.test.ts`
- [x] T017 Implement YouTube parsing, route/query helpers, and stable cursor utilities that satisfy T016 in `lib/youtube.ts`, `lib/routes.ts`, and `features/portfolio/model/cursor.ts`
- [x] T018 [P] Add behavior and accessibility tests for button, dialog, sheet, tabs, accordion, toast, form controls, skeleton, and empty/error states in `tests/component/ui-primitives.test.tsx`
- [x] T019 Add the tested shadcn/Radix primitives, Lucide icon wrapper, and shared state components in `components/ui/`, `components/site/status-state.tsx`, and `lib/cn.ts`

**Checkpoint**: Domain behavior and persistence pass unit/component tests without any page UI.

---

## Phase 3: User Story 1 - 서비스와 공개 사례 탐색 (Priority: P1) 🎯 MVP

**Goal**: Customers can select the four PRD services and explore only public cases with
URL-owned filters and explicit load-more behavior.

**Independent Test**: Start from `/`, open any service in one action, filter public cases,
reload/back, and load the next stable page without exposing private data.

- [x] T020 [P] [US1] Write failing component tests for the public header/mobile menu/footer, four service cards, portfolio cards, filter query sync, empty state, skeleton, and load-more ordering in `tests/component/public-browse.test.tsx`
- [x] T021 [US1] Implement the responsive public shell, logo slot, header dropdown, mobile navigation sheet, footer, service card, and shared section components that satisfy the shell assertions in T020 in `app/(site)/layout.tsx`, `components/site/header.tsx`, `components/site/mobile-menu.tsx`, `components/site/footer.tsx`, and `components/site/service-card.tsx`
- [x] T022 [US1] Implement the server-rendered home sections with four canonical services, featured before/after, recent public cases, process/price/trust previews, and FAB composition in `app/(site)/page.tsx` and `components/site/home-sections.tsx`
- [x] T023 [US1] Implement the four-service overview and shared service detail template with service-specific PRD copy/scope/tags, sticky section tabs, public case grid, filter query synchronization, empty/loading states, and load more in `app/(site)/services/page.tsx`, `app/(site)/services/[service]/page.tsx`, `features/portfolio/ui/service-page.tsx`, `features/portfolio/ui/portfolio-filter.tsx`, and `features/portfolio/ui/portfolio-grid.tsx`
- [x] T024 [US1] Implement the all-public-cases page with service and secondary filters, stable pagination, reset action, and identical public visibility rules in `app/(site)/portfolio/page.tsx` and `features/portfolio/ui/all-portfolio-page.tsx`
- [x] T025 [US1] Add Playwright coverage for home-to-four-services navigation, URL filter persistence, load more, public-only counts, private absence, 390px layout, and 1440px layout in `tests/e2e/public-browse.spec.ts`

**Checkpoint**: User Story 1 is independently demonstrable and constitutes the first customer MVP.

---

## Phase 4: User Story 2 - 사례를 빠르게 보고 깊게 확인 (Priority: P1)

**Goal**: Customers can use canonical-URL quick view without losing list context, then open
full detail, gallery lightbox, lazy YouTube, related cases, and generic 404 states.

**Independent Test**: Open a card from a filtered list, traverse previous/next, Back-close,
Forward-reopen, direct-open full detail, and use the lightbox with keyboard/touch controls.

- [x] T026 [P] [US2] Write failing component tests for quick-view focus trap/return, filtered previous-next, body scroll lock, full-detail grouping, lazy YouTube activation, lightbox controls, related-case exclusion, and generic 404 copy in `tests/component/case-exploration.test.tsx`
- [x] T027 [P] [US2] Implement reusable case media, before/after, metadata, card, gallery, and related-card components that satisfy T026 data and accessibility contracts in `components/portfolio/portfolio-card.tsx`, `components/portfolio/before-after.tsx`, `components/portfolio/gallery-grid.tsx`, and `components/portfolio/case-metadata.tsx`
- [x] T028 [US2] Implement the default modal slot and intercepted `/portfolio/[slug]` quick-view route with canonical history, close/back behavior, focus restoration, active-filter previous-next, desktop dialog, and mobile full-screen layout in `app/(site)/@modal/default.tsx`, `app/(site)/@modal/(.)portfolio/[slug]/page.tsx`, and `features/portfolio/ui/quick-view.tsx`
- [x] T029 [US2] Implement the direct case detail route with breadcrumb, grouped public galleries, hidden empty sections, result summary, related cases, service/price links, and customer-safe 404 fallback in `app/(site)/portfolio/[slug]/page.tsx` and `features/portfolio/ui/case-detail.tsx`
- [x] T030 [P] [US2] Implement click-to-load YouTube thumbnail/player states with no autoplay and responsive Shorts handling in `components/portfolio/youtube-lazy.tsx`
- [x] T031 [P] [US2] Integrate Yet Another React Lightbox for detail-only desktop/mobile viewing, captions, count, keyboard/swipe/zoom, reduced motion, and FAB hiding in `components/portfolio/case-lightbox.tsx`
- [x] T032 [US2] Add Playwright coverage for intercepted/direct route distinction, Back/Forward history, filter/scroll/focus restoration, no modal-lightbox stacking, lazy iframe loading, related exclusions, and private/deleted/unknown 404 parity in `tests/e2e/case-exploration.spec.ts`

**Checkpoint**: Both P1 customer stories are complete and independently verifiable.

---

## Phase 5: User Story 3 - 관리자 사례 초안 작성과 복원 (Priority: P2)

**Goal**: Administrators enter `/admin` without login, create/edit private drafts, and recover
JSON mock state after refresh or corruption.

**Independent Test**: Create a draft, edit metadata, reload to restore it, then corrupt storage
and verify seed recovery plus a clear notification.

- [x] T033 [P] [US3] Write failing component tests for direct admin entry, dashboard statistics, list filters, private draft creation, React Hook Form validation, autosave states, reload restoration, and corruption recovery in `tests/component/admin-drafts.test.tsx`
- [x] T034 [P] [US3] Implement the responsive admin shell, desktop sidebar, mobile app bar/sheet, dashboard statistics, recent edits, and direct unauthenticated routing in `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/admin-sidebar.tsx`, and `components/admin/admin-app-bar.tsx`
- [x] T035 [US3] Implement the administrator case list with public/private/service filters, mobile cards, desktop rows, edit links, empty state, and seeded reset affordance in `app/admin/portfolio/page.tsx` and `features/portfolio/ui/admin-case-list.tsx`
- [x] T036 [US3] Implement private quick-create and metadata editing forms with service/title/region/date/slug/summary/tags/descriptions, Zod validation, manual save, debounced autosave, duplicate-submit prevention, and sticky mobile actions in `app/admin/portfolio/new/page.tsx`, `app/admin/portfolio/[id]/edit/page.tsx`, and `features/portfolio/ui/admin-case-form.tsx`
- [x] T037 [US3] Implement saved/saving/failed/recovered status UI that preserves input during persistence errors and explains session-only photo behavior in `components/admin/autosave-status.tsx` and `components/admin/recovery-notice.tsx`
- [x] T038 [US3] Add Playwright coverage for `/admin` bypass, draft creation, validation errors, autosave, refresh restoration, list filters, storage corruption recovery, and input retention on quota failure in `tests/e2e/admin-drafts.spec.ts`

**Checkpoint**: Administrator metadata workflows operate without a backend and survive refresh.

---

## Phase 6: User Story 4 - 사진·영상 정리와 공개 검토 (Priority: P2)

**Goal**: Administrators exercise the complete media organization, YouTube, publish,
unpublish, and privacy flow without remote storage.

**Independent Test**: Select files, observe progress/failure, classify and select a cover,
validate YouTube links, complete publish checks, confirm public exposure, then unpublish.

- [x] T039 [P] [US4] Write failing component tests for upload counters, 20/69 blocking, progress/partial failure/retry, media stage/public/cover bulk actions, three-video limit, publish issues, success, unpublish, and delete confirmations in `tests/component/admin-publishing.test.tsx`
- [x] T040 [US4] Implement mobile/desktop file selection, counters, progress items, limit dialogs, partial failure retry, session fallback notice, and object URL cleanup using the foundational upload manager in `features/uploads/ui/upload-panel.tsx`, `features/uploads/ui/upload-item.tsx`, and `features/uploads/ui/upload-limit-dialog.tsx`
- [x] T041 [US4] Implement photo management tabs/grid, selection mode, bulk stage/public actions, within-stage ordering, cover selection, caption/alt editing, and 69-item state in `features/uploads/ui/photo-manager.tsx`, `components/admin/photo-tile.tsx`, and `components/admin/photo-selection-bar.tsx`
- [x] T042 [P] [US4] Implement YouTube add/edit/reorder/public/delete behavior, supported URL preview, invalid state, and three-item limit in `features/portfolio/ui/youtube-manager.tsx`
- [x] T043 [US4] Implement the seven-item privacy checklist, derived metadata/media checks, disabled/enabled publish action, atomic publish result, success toast, and inline issue navigation in `features/publishing/model/publish-validator.ts`, `features/publishing/ui/publish-checklist.tsx`, and `features/publishing/ui/publish-status.tsx`
- [x] T044 [US4] Implement unpublish and soft-delete confirmations with immediate customer selector removal and generic direct-route 404 behavior in `features/publishing/ui/unpublish-dialog.tsx` and `features/publishing/ui/delete-case-dialog.tsx`
- [x] T045 [US4] Add Playwright coverage for valid file selection, 21-file rejection, 69-item lock, partial failure retry, refresh fallback media, stage/cover/public actions, YouTube validation, blocked publish, successful public visibility, and unpublish removal in `tests/e2e/admin-publishing.spec.ts`

**Checkpoint**: The full local administrator publishing flow is demonstrable with privacy rules.

---

## Phase 7: User Story 5 - 안내 콘텐츠와 반응형·접근성 이용 (Priority: P3)

**Goal**: Supporting pages and cross-cutting responsive/accessibility states complete the PRD
experience at mobile and desktop reference sizes.

**Independent Test**: Navigate all supporting pages at 390px/1440px and complete core public
and admin actions with keyboard, reduced motion, and accessible error/status feedback.

- [x] T046 [P] [US5] Write failing component tests for pricing cards, process steps, about/privacy/404 content, FAQ accordion, mobile menu/FAB visibility, sticky tabs, 44px targets, reduced motion, and non-color status cues in `tests/component/support-accessibility.test.tsx`
- [x] T047 [P] [US5] Implement responsive pricing with vertical mobile cards, sample replacement notes, conditions, photo-check rationale, and FAQ in `app/(site)/pricing/page.tsx` and `components/site/pricing-sections.tsx`
- [x] T048 [P] [US5] Implement the seven-step process page, service differences, and cross-links in `app/(site)/process/page.tsx` and `components/site/process-sections.tsx`
- [x] T049 [P] [US5] Implement the about, privacy template, and generic not-found pages with safe placeholders and no fabricated metrics in `app/(site)/about/page.tsx`, `app/(site)/privacy/page.tsx`, and `app/not-found.tsx`
- [x] T050 [US5] Implement global responsive rules, sticky tabs offset, menu/modal/lightbox-aware FAB, reduced-motion CSS, 44px target enforcement, focus-visible styling, and safe-area handling in `components/site/sticky-section-tabs.tsx`, `components/site/estimate-fab.tsx`, and `app/globals.css`
- [x] T051 [US5] Add Playwright keyboard, focus, reduced-motion, mobile safe-area, no-horizontal-scroll, support-page, and basic axe coverage at 390x844 and 1440x900 in `tests/e2e/accessibility-responsive.spec.ts`

**Checkpoint**: All five user stories satisfy their independent acceptance criteria.

---

## Phase 8: Polish, Performance, and Handoff

**Purpose**: Verify cross-story quality and preserve every production integration obligation.

- [x] T052 [P] Add failing unit tests and implement metadata defaults, canonical URLs, breadcrumb JSON-LD, lazy-media rules, image `sizes`, and one-priority-hero policy for seeded public routes in `tests/unit/metadata-performance.test.ts`, `lib/metadata.ts`, and the relevant files under `app/(site)/`
- [x] T053 [P] Add deterministic loading, empty, image failure, YouTube failure, network/save failure, upload failure, and toast examples without leaking technical/private state in `components/site/status-state.tsx`, `components/portfolio/media-fallback.tsx`, and `components/admin/admin-error-state.tsx`
- [x] T054 Review every temporary substitute against `docs/project/deferred-backend-integration.md`, link concrete adapter/UI paths, and ensure auth, DB, RLS, Storage, server validation, SEO, observability, content, deployment, and migration sections remain complete in `docs/project/deferred-backend-integration.md`
- [x] T055 Update the implementation handoff with route map, repository contract, test commands, mock reset instructions, known frontend-only limitations, and production-readiness warning in `README.md`
- [x] T056 Capture and review key 390x844 and 1440x900 screenshots against `design/hygiene-tech__*.pdf`, fix clipping/overlap/font/focus/placeholder issues in affected files, and record results in `docs/verification/frontend-visual-review.md`
- [x] T057 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`; record exact command outputs, failures resolved, remaining deferred risks, and PRD acceptance mapping in `docs/verification/frontend-final-verification.md`

---

## Dependencies and Execution Order

### Phase dependencies

```text
Phase 1 Setup
  -> Phase 2 Foundational Contracts and State
      -> US1 Public Browse
          -> US2 Case Exploration
      -> US3 Admin Drafts
          -> US4 Media and Publishing
      -> US5 Supporting Content and Accessibility
          -> Phase 8 Polish and Handoff
```

- Phase 2 blocks all user stories.
- US2 depends on US1's list/card/filter context.
- US4 depends on US3's draft/edit flows and the foundational upload manager.
- US5 may start after Phase 2, but its final cross-cutting work must be rechecked after US2/US4.
- Phase 8 starts only after all selected user stories pass their checkpoints.

### Parallel opportunities

- T002-T004 can run in parallel after T001.
- T006, T008, T014, T016, and T018 target independent foundational files.
- In every user-story phase, the first failing-test task blocks that phase's implementation
  tasks; implementation files may split in parallel only after the expected failures are seen.
- Within US2, T027, T030, and T031 are separate component files after T026 defines behavior.
- Within US5, T047-T049 are independent route groups after T046 defines behavior.
- Documentation tasks T054-T055 can run parallel with performance task T052 after story completion.

### Parallel example: User Story 5

```text
Worker A: T047 pricing route and sections
Worker B: T048 process route and sections
Worker C: T049 about/privacy/not-found routes
Join: T050 global responsive behavior -> T051 E2E verification
```

## Implementation Strategy

### MVP first

1. Complete Phase 1 and Phase 2.
2. Complete US1 and demonstrate service/public-case exploration.
3. Add US2 to complete the customer portfolio MVP.
4. Stop for review before starting administrator stories.

### Incremental delivery

1. Customer browsing: US1.
2. Customer detail and history: US2.
3. Administrator drafts and persistence: US3.
4. Media organization and publish boundary: US4.
5. Supporting content and accessibility: US5.
6. Cross-story verification and production handoff: Phase 8.

### Task completion rule

A task is complete only when its focused tests have demonstrated Red then Green, the relevant
broader suite passes, changed UI has been inspected at its reference sizes, and the task's
files contain no unresolved placeholder or undocumented temporary integration.

## Requirement Coverage

| Requirement | Primary task coverage |
|---|---|
| FR-001, FR-002 | T021-T023, T025 |
| FR-003 | T011, T023-T025, T029, T032, T045 |
| FR-004, FR-005 | T020, T023-T025 |
| FR-006, FR-007 | T026, T028, T032 |
| FR-008, FR-009, FR-010 | T026-T032 |
| FR-011 | T026, T030, T032 |
| FR-012 | T029, T032, T044 |
| FR-013 | T047-T049, T051 |
| FR-014 | T022, T050-T051 |
| FR-015, FR-016, FR-017 | T033-T038 |
| FR-018 | T014-T015, T039-T040, T045 |
| FR-019, FR-020 | T014-T015, T039-T040, T045 |
| FR-021 | T039, T041, T045 |
| FR-022 | T016-T017, T039, T042, T045 |
| FR-023 | T039, T043, T045 |
| FR-024 | T011, T044-T045 |
| FR-025 | T010-T013, T033, T037-T038 |
| FR-026, FR-027 | T018-T019, T046, T050-T051, T056 |
| FR-028 | T018-T019, T037, T040, T053 |
| FR-029 | T008-T009, T022-T024, T047-T049, T056 |
| FR-030 | T005, T054-T055, T057 |
| FR-031 | T001, T005, T011, T054-T055 |
| SC-001 | T022, T025 |
| SC-002 | T028, T032 |
| SC-003 | T011, T032, T045 |
| SC-004 | T036, T038, T045 |
| SC-005 | T014-T015, T039-T040, T045 |
| SC-006 | T010-T013, T038 |
| SC-007, SC-008 | T018-T019, T025, T032, T046, T050-T051, T056 |
| SC-009 | T057 |
| SC-010 | T054, T057 |
