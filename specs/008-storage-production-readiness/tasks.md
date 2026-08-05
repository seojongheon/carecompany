# Tasks: 운영 이미지 Storage 활성화

**Input**: Design documents from `specs/008-storage-production-readiness/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/image-storage.md`, `quickstart.md`

## Phase 1: Setup

- [ ] T001 현재 Storage 관련 사용자 변경사항과 테스트 기준선을 확인한다: `features/portfolio/storage/`, `features/uploads/`, `features/site-content/`, `tests/`
- [ ] T002 운영 이미지 Storage용 마이그레이션 뼈대를 추가한다: `supabase/migrations/20260805000100_storage_production_readiness.sql`

## Phase 2: Foundational

- [ ] T003 [P] 업로드 제한 및 보상 실패 테스트를 먼저 추가한다: `tests/unit/storage/storage-gateway.test.ts`
- [ ] T004 [P] 사례·랜딩 Storage RLS 실패/성공 테스트를 먼저 추가한다: `supabase/tests/database/050_storage_access.test.sql`
- [ ] T005 [P] 랜딩 업로드·게시 공개·삭제 오류 컴포넌트 테스트를 먼저 추가한다: `tests/component/image-upload-flows.test.tsx`

## Phase 3: User Story 1 - 사례 이미지 안전 저장 (Priority: P1)

**Goal**: 활성 관리자만 원본과 검토본을 일관되게 저장·삭제하고 게시된 검토본만 공개한다.

**Independent Test**: 역할별 업로드/조회/삭제 정책과 부분 실패 보상을 단독으로 검증한다.

- [ ] T006 [US1] 버킷 제한과 사례 경로·공개 상태 RLS를 강화한다: `supabase/migrations/20260805000100_storage_production_readiness.sql`
- [ ] T007 [US1] 다중 업로드 실패 시 이번 작업의 객체를 모두 보상 삭제한다: `features/portfolio/storage/storage-gateway.ts`
- [ ] T008 [US1] 업로드 뒤 미디어 참조를 단일 트랜잭션으로 저장하고, 참조 저장 실패 시 새 객체를 정리한다: `features/uploads/ui/upload-panel.tsx`, `features/portfolio/repository/supabase-portfolio-repository.ts`
- [ ] T009 [US1] 개별 삭제는 DB 참조를 트랜잭션으로 먼저 제거하고 객체 정리 실패를 재시도 상태로 유지한다: `features/uploads/ui/photo-manager.tsx`, `features/portfolio/storage/storage-gateway.ts`
- [ ] T010 [US1] 사례 signed URL 동작과 비활성 플래그 회귀 테스트를 통과시킨다: `features/portfolio/storage/use-case-media-urls.ts`, `tests/component/storage-development-guard.test.tsx`

## Phase 4: User Story 2 - 랜딩 대표 이미지 게시 (Priority: P1)

**Goal**: 랜딩 대표 이미지를 실제 저장하고 게시본에만 공개 접근을 허용한다.

**Independent Test**: 초안 업로드 전후와 게시 전후의 공개 화면 이미지 변화를 단독으로 검증한다.

- [ ] T011 [US2] 랜딩 전용 비공개 버킷과 관리자 쓰기·게시본 읽기 정책을 구현한다: `supabase/migrations/20260805000100_storage_production_readiness.sql`
- [ ] T012 [US2] 랜딩 이미지 WebP 업로드와 안전한 정리 계약을 구현한다: `features/site-content/storage/hero-storage-gateway.ts`
- [ ] T013 [US2] 관리자 랜딩 이미지 입력을 실제 업로드·오류·재시도 상태에 연결한다: `features/site-content/ui/landing-hero-image-manager.tsx`
- [ ] T014 [US2] 게시 경로의 signed URL을 공개 홈페이지에 연결한다: `features/site-content/repository/supabase-site-content-repository.ts`, `features/site-content/repository/site-content-provider.tsx`, `components/site/home-sections.tsx`
- [ ] T015 [US2] 콘텐츠 참조를 보존하는 랜딩 이미지 정리 로직과 테스트를 추가한다: `features/site-content/storage/hero-storage-gateway.ts`, `tests/unit/storage/hero-storage-gateway.test.ts`

## Phase 5: User Story 3 - 운영 활성화와 롤백 (Priority: P2)

**Goal**: 정책 검증 후 Vercel에서 안전하게 켜고 장애 시 새 작업을 중단한다.

**Independent Test**: 플래그 false/true 빌드와 운영 체크리스트를 각각 수행한다.

- [ ] T016 [US3] 환경변수 설명과 안전한 기본값을 갱신한다: `.env.example`, `README.md`
- [ ] T017 [US3] Storage 활성화·검증·롤백 절차와 미완료 항목을 갱신한다: `supabase/storage/README.md`, `docs/project/deferred-backend-integration.md`
- [ ] T018 [US3] 운영 플래그 true 상태에서 단위·컴포넌트 테스트와 프로덕션 빌드를 검증한다: `tests/`, `package.json`

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T019 전체 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`를 실행한다: `package.json`
- [ ] T020 Storage 정책 테스트와 quickstart 시나리오를 실행하고 결과를 기록한다: `supabase/tests/database/050_storage_access.test.sql`, `specs/008-storage-production-readiness/quickstart.md`

## Dependencies & Execution Order

- Phase 1이 현재 상태와 마이그레이션 기준을 고정한다.
- Phase 2의 실패 테스트가 Phase 3과 Phase 4 구현보다 먼저 실행되어야 한다.
- User Story 1과 User Story 2는 공통 마이그레이션을 제외하면 독립적으로 검증할 수 있다.
- User Story 3은 앞선 두 스토리의 검증 완료 후 진행한다.
- 전체 검증은 모든 구현과 문서 갱신 뒤 실행한다.

## Parallel Opportunities

- T003, T004, T005는 서로 다른 테스트 계층이므로 병렬 작성 가능하다.
- T007과 T012는 서로 다른 gateway이므로 공통 마이그레이션 계약 확정 뒤 병렬 구현 가능하다.
- T016과 T017은 기능 검증이 끝난 뒤 병렬 문서화 가능하다.

## Implementation Strategy

1. RLS 및 gateway 실패 테스트로 안전 경계를 먼저 고정한다.
2. 사례 이미지 저장·삭제를 완성하고 독립 검증한다.
3. 랜딩 대표 이미지 저장·게시 조회를 완성하고 독립 검증한다.
4. 운영 문서와 환경변수를 갱신한다.
5. 전체 검증 후에만 Vercel 운영 플래그를 `true`로 설정한다.
