# Case Management Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사례 관리 중심 진입, 작업 전·후 업로드, 확대 사진 단계 배지를 구현한다.

**Architecture:** 기존 경로와 저장소 경계를 보존한다. 관리자 진입점만 재배치하고 `UploadPanel`에 단계를 주입하며 라이트박스의 렌더 확장 지점에서 배지를 파생한다.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Playwright, yet-another-react-lightbox.

## Global Constraints

- Storage는 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED`가 명시적으로 켜지기 전까지 원격 업로드하지 않는다.
- 회당 20장, 사례당 69장, 파일당 20MB 제한을 유지한다.
- 각 프로덕션 변경 전에 실패 테스트를 확인한다.

### Task 1: 사례 관리 진입 통합

**Files:** `tests/component/admin-drafts.test.tsx`, `components/admin/admin-dashboard.tsx`, `components/admin/admin-sidebar.tsx`, `components/admin/admin-app-bar.tsx`, `app/admin/(protected)/portfolio/page.tsx`

- [ ] 사례 관리 CTA와 새 사례 메뉴 제거를 검증하는 테스트를 작성한다.
- [ ] 테스트가 기존 UI 때문에 실패하는지 확인한다.
- [ ] 사례 관리 헤더에 `/admin/portfolio/new` 버튼을 추가하고 중복 진입을 제거한다.
- [ ] 테스트를 다시 실행해 통과를 확인한다.

### Task 2: 작업 전·후 업로드

**Files:** `tests/component/image-upload-flows.test.tsx`, `features/uploads/model/image-upload-guidance.ts`, `features/uploads/ui/upload-panel.tsx`, `features/portfolio/ui/admin-publishing-workspace.tsx`

- [ ] 두 드롭존과 각 단계 저장을 검증하는 실패 테스트를 작성한다.
- [ ] `UploadPanel`의 필수 `stage` 입력이 없어 실패하는지 확인한다.
- [ ] 단계별 안내와 입력 라벨을 생성하고 미디어 `stage`에 전달한다.
- [ ] 편집 워크스페이스에 작업 전·후 패널을 렌더링한다.
- [ ] 업로드 관련 테스트를 통과시킨다.

### Task 3: 확대 사진 단계 배지

**Files:** `tests/component/case-exploration.test.tsx`, `features/portfolio/ui/quick-view.tsx`, `components/portfolio/case-lightbox.tsx`

- [ ] 작업 전·후 배지를 검증하는 실패 테스트를 작성한다.
- [ ] 배지가 없어 실패하는지 확인한다.
- [ ] 빠른 상세보기 대표 사진과 `slideHeader`에 현재 사진의 `stage`를 기반으로 작은 우측 상단 배지를 렌더링한다.
- [ ] 라이트박스 테스트를 통과시킨다.

### Task 4: 회귀 검증

**Files:** `tests/e2e/admin-drafts.spec.ts`, `tests/e2e/admin-publishing.spec.ts`, `tests/e2e/case-exploration.spec.ts`

- [ ] E2E 기대값을 새 UI에 맞춘다.
- [ ] 관련 Playwright 흐름을 실행한다.
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`를 실행한다.
