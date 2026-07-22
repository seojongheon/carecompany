# Tasks: 관리자 홈페이지 콘텐츠 관리

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Setup

- [ ] T001 Confirm baseline tests and document the frontend-only storage boundary in `docs/project/deferred-backend-integration.md`

## Phase 2: Foundational

- [ ] T002 Write failing repository tests for draft, publish, version restore, and invalid publish in `tests/unit/site-content-repository.test.ts`
- [ ] T003 Implement site-content types, seed content, publish validation, and schemas in `features/site-content/model/types.ts`, `features/site-content/model/seed.ts`, and `features/site-content/model/schemas.ts`
- [ ] T004 Implement the localStorage repository and React provider in `features/site-content/repository/site-content-repository.ts`, `features/site-content/repository/local-storage-site-content-repository.ts`, and `features/site-content/repository/site-content-provider.tsx`
- [ ] T005 Integrate the site-content provider into `app/layout.tsx`

## Phase 3: User Story 1 - 홈과 공통 사이트 정보 관리 (P1)

**Goal**: 관리자가 홈과 공통 정보를 초안으로 저장하고 게시하면 고객 홈과 푸터가 갱신된다.

- [ ] T006 [US1] Write failing component tests for home draft isolation, publish, and footer update in `tests/component/site-content-admin.test.tsx`
- [ ] T007 [US1] Create the site-content admin hub and home/settings editor in `app/admin/site/page.tsx` and `features/site-content/ui/site-content-admin.tsx`
- [ ] T008 [US1] Update the customer home and footer to read published content in `components/site/home-sections.tsx` and `components/site/footer.tsx`
- [ ] T009 [US1] Add the site-content entry to desktop and mobile admin navigation in `components/admin/admin-sidebar.tsx` and `components/admin/admin-app-bar.tsx`

## Phase 4: User Story 2 - 서비스와 가격 관리 (P1)

- [ ] T010 [US2] Write failing component tests for pricing add/reorder/publish in `tests/component/site-content-admin.test.tsx`
- [ ] T011 [US2] Add service and pricing editors to `features/site-content/ui/site-content-admin.tsx`
- [ ] T012 [US2] Update pricing and service customer sections to read published content in `components/site/pricing-sections.tsx` and `features/portfolio/ui/service-page.tsx`

## Phase 5: User Story 3 - 안내 페이지 콘텐츠 관리 (P2)

- [ ] T013 [US3] Write failing component tests for process/about draft isolation and publishing in `tests/component/site-content-admin.test.tsx`
- [ ] T014 [US3] Add process/about editors in `features/site-content/ui/site-content-admin.tsx`
- [ ] T015 [US3] Update process and about pages in `components/site/process-sections.tsx` and `app/(site)/about/page.tsx`

## Phase 6: Polish

- [ ] T016 Add accessible publish validation, responsive status feedback, and reset affordance in `features/site-content/ui/site-content-admin.tsx`
- [ ] T017 Run unit/component tests, lint, typecheck, build, and relevant Playwright flows from `specs/002-admin-site-content-management/quickstart.md`

## Dependencies

T002–T005 block UI work. T006–T009 establish the primary publish flow. T010–T012 and T013–T015 extend the same repository/provider. T016–T017 finish cross-cutting verification.
