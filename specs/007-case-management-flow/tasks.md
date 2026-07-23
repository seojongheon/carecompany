# Tasks: 사례 관리 중심 편집과 전후 사진 구분

## Phase 1: 사례 관리 진입 통합

- [ ] T001 [US1] 관리자 내비게이션과 사례 관리 CTA 기대 동작을 `tests/component/admin-drafts.test.tsx`에 실패 테스트로 추가한다.
- [ ] T002 [US1] 대시보드·사이드바·모바일 앱바의 생성 링크를 제거하고 `app/admin/(protected)/portfolio/page.tsx`에 사례 추가 버튼을 배치한다.
- [ ] T003 [US1] 관련 컴포넌트 테스트를 통과시키고 회귀를 확인한다.

## Phase 2: 단계별 이미지 업로드

- [ ] T004 [US2] 작업 전·후 드롭존과 저장 단계 기대 동작을 `tests/component/image-upload-flows.test.tsx`에 실패 테스트로 추가한다.
- [ ] T005 [P] [US2] 단계별 안내를 생성하도록 `features/uploads/model/image-upload-guidance.ts`를 확장한다.
- [ ] T006 [US2] `features/uploads/ui/upload-panel.tsx`가 `before | after` 단계를 받아 해당 단계로 미디어를 생성하도록 수정한다.
- [ ] T007 [US2] `features/portfolio/ui/admin-publishing-workspace.tsx`에 작업 전·후 업로드 패널을 각각 렌더링한다.
- [ ] T008 [US2] 기존 업로드·사진 관리 컴포넌트 테스트를 통과시킨다.

## Phase 3: 확대 사진 단계 배지

- [ ] T009 [US3] 빠른 상세보기와 작업 전·후 라이트박스 배지 기대 동작을 `tests/component/case-exploration.test.tsx`에 실패 테스트로 추가한다.
- [ ] T010 [US3] `features/portfolio/ui/quick-view.tsx`와 `components/portfolio/case-lightbox.tsx`에 현재 사진 단계 배지를 구현한다.
- [ ] T011 [US3] 라이트박스와 사례 상세 컴포넌트 테스트를 통과시킨다.

## Phase 4: E2E 및 전체 검증

- [ ] T012 [P] 관리자 생성·편집·전후 업로드 흐름을 `tests/e2e/admin-drafts.spec.ts`와 `tests/e2e/admin-publishing.spec.ts`에 반영한다.
- [ ] T013 [P] 고객 확대 배지를 `tests/e2e/case-exploration.spec.ts`에 반영한다.
- [ ] T014 관련 Playwright, 전체 테스트, lint, typecheck, production build를 실행한다.

## Dependencies

- US1은 독립적이다.
- US2는 기존 사례 편집 경로에만 의존하며 US1과 병렬 검증 가능하다.
- US3는 기존 고객 상세 경로에만 의존하며 US1·US2와 독립 구현 가능하다.

## MVP

US1과 US2를 완료하면 관리자가 사례 관리에서 생성·편집하고 전후 사진을 올리는 핵심 업무를 수행할 수 있다.
