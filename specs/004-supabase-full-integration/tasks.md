# Tasks: Supabase 전체 연동

**Input**: Design documents from `/specs/004-supabase-full-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 데이터베이스 정책과 애플리케이션 동작은 TDD로 구현한다. 각 테스트 작업은 대응 구현 전에 실행하여 기대한 이유로 실패하는지 확인한다.

**Organization**: 공통 기반을 먼저 구축하고, 각 사용자 스토리가 독립적으로 검증 가능한 순서로 구현한다.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Supabase CLI, SDK, 환경 설정과 디렉터리 구조를 재현 가능하게 준비한다.

- [ ] T001 Install `@supabase/supabase-js`, `@supabase/ssr`, and project-local Supabase CLI dependencies in `package.json` and `pnpm-lock.yaml`
- [ ] T002 [P] Add public/server/Storage environment validation and sample variables in `lib/supabase/env.ts` and `.env.example`
- [ ] T003 [P] Add linked-project-safe Supabase configuration and non-production seed entrypoint in `supabase/config.toml` and `supabase/seed.sql`
- [ ] T004 [P] Add Supabase generated-type script and database verification scripts in `package.json` and `scripts/generate-supabase-types.sh`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 공유하는 스키마, 권한 도우미, 클라이언트와 세션 갱신 기반을 구축한다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 사용자 스토리 구현을 시작하지 않는다.

- [ ] T005 Write failing pgTAP schema, constraint, profile-trigger, and baseline RLS assertions in `supabase/tests/database/000_foundation.test.sql`
- [ ] T006 Implement enums, profiles, services, portfolio, site-content, price, audit tables, indexes, limits, timestamps, and customer-profile trigger in `supabase/migrations/20260723000100_core_schema.sql`
- [ ] T007 Implement private role helpers, grants, baseline RLS enablement, and immutable audit protections in `supabase/migrations/20260723000200_authorization_foundation.sql`
- [ ] T008 Verify foundation pgTAP tests fail before T006-T007 and pass afterward with `pnpm supabase test db`, recording Docker unavailability if local database tests cannot run
- [ ] T009 [P] Write failing Supabase environment and client factory tests in `tests/unit/supabase/env.test.ts` and `tests/unit/supabase/client-factories.test.ts`
- [ ] T010 Implement browser, server, and proxy Supabase factories in `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `lib/supabase/proxy.ts`
- [ ] T011 Implement session refresh and auth callback routing in `proxy.ts` and `app/auth/callback/route.ts`
- [ ] T012 Generate the initial database contract in `lib/supabase/database.types.ts` and make T009-T011 tests pass

**Checkpoint**: 스키마와 세션 기반이 준비되어 각 스토리를 구현할 수 있다.

---

## Phase 3: User Story 1 - 안전한 공개 콘텐츠 조회 (Priority: P1) 🎯 MVP

**Goal**: 익명 방문자는 게시된 사례, 게시본 홈페이지 콘텐츠, 활성 서비스와 노출 가격만 조회한다.

**Independent Test**: 익명 권한에서 게시본은 보이고 초안·비공개·삭제·관리자 데이터는 모든 직접 조회와 RPC에서 차단된다.

### Tests for User Story 1

- [ ] T013 [P] [US1] Write failing anonymous/public RLS and published-projection pgTAP assertions in `supabase/tests/database/010_public_reads.test.sql`
- [ ] T014 [P] [US1] Write failing mapper, public repository, and public route tests in `tests/unit/portfolio/supabase-mappers.test.ts`, `tests/unit/portfolio/supabase-portfolio-repository.test.ts`, `tests/unit/site-content/supabase-site-content-repository.test.ts`, and `tests/e2e/supabase-public-data.spec.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Implement public service, case, media, video, tag, price policies and published site-content RPC in `supabase/migrations/20260723000300_public_read_policies.sql`
- [ ] T016 [US1] Implement database-to-domain mappings and public Supabase reads in `features/portfolio/repository/supabase-mappers.ts`, `features/portfolio/repository/supabase-portfolio-repository.ts`, and `features/site-content/repository/supabase-site-content-repository.ts`
- [ ] T017 [US1] Hydrate production providers from Supabase while retaining mock repositories only as explicit test dependencies in `features/portfolio/repository/portfolio-provider.tsx` and `features/site-content/repository/site-content-provider.tsx`
- [ ] T018 [US1] Connect public home, service, price, portfolio list, and portfolio detail rendering to published Supabase projections in `app/page.tsx`, `app/services/[slug]/page.tsx`, `app/pricing/page.tsx`, `app/portfolio/page.tsx`, and `app/portfolio/[slug]/page.tsx`
- [ ] T019 [US1] Run T013-T014 and `tests/e2e/supabase-public-data.spec.ts`, then record direct private/deleted-route not-found evidence in `specs/004-supabase-full-integration/quickstart.md`

**Checkpoint**: 공개 사이트는 브라우저 목업이 아니라 Supabase 게시 데이터만 사용한다.

---

## Phase 4: User Story 2 - 실제 고객 인증 (Priority: P1)

**Goal**: 고객 가입·로그인·로그아웃·비밀번호 재설정과 서버 검증 세션을 실제 Supabase Auth로 처리한다.

**Independent Test**: 신규 가입자는 customer 프로필로 생성되고 자신의 프로필만 보며 보호된 관리자 경로에 접근하지 못한다.

### Tests for User Story 2

- [ ] T020 [P] [US2] Write failing customer profile isolation and privilege-escalation pgTAP assertions in `supabase/tests/database/020_customer_auth.test.sql`
- [ ] T021 [P] [US2] Write failing Supabase auth adapter, generic recovery-message, and customer-flow tests in `tests/unit/auth/supabase-auth-repository.test.ts`, `tests/unit/auth/auth-actions.test.ts`, and `tests/e2e/supabase-customer-auth.spec.ts`
- [ ] T022 [P] [US2] Write failing protected admin route authorization tests in `tests/unit/auth/server-authorization.test.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Complete customer profile read/update policies and deny role-field updates in `supabase/migrations/20260723000400_customer_profile_policies.sql`
- [ ] T024 [US2] Implement Supabase customer/admin sign-in, sign-up, sign-out, recovery, and session subscription in `features/auth/repository/supabase-auth-repository.ts` and `features/auth/repository/auth-provider.tsx`
- [ ] T025 [US2] Implement server auth context, active-admin authorization, and generic auth server actions in `features/auth/server/authorization.ts` and `app/actions/auth.ts`
- [ ] T026 [US2] Add password-update recovery screen and wire existing customer/admin forms to Supabase outcomes in `app/auth/update-password/page.tsx`, `features/auth/components/auth-card.tsx`, and `features/auth/components/admin-login-form.tsx`
- [ ] T027 [US2] Move existing administrator screens under a protected route-group layout and enforce server redirects in `app/admin/(protected)/layout.tsx` while leaving `app/admin/login/page.tsx` public
- [ ] T028 [US2] Run T020-T022 and `tests/e2e/supabase-customer-auth.spec.ts`, then record protected-admin denial evidence in `specs/004-supabase-full-integration/quickstart.md`

**Checkpoint**: 공개 가입은 고객 전용이며 관리자 경계는 서버에서 검증된다.

---

## Phase 5: User Story 3 - 관리자 콘텐츠 운영 (Priority: P1)

**Goal**: 활성 관리자가 사례·미디어 메타데이터·영상·태그·가격·사이트 초안을 변경하고 원자적으로 게시한다.

**Independent Test**: 관리자가 비공개 사례와 초안을 저장한 뒤 검증을 통과한 게시본만 공개 조회에 반영하며 비활성 관리자의 변경은 거부된다.

### Tests for User Story 3

- [ ] T029 [P] [US3] Write failing active-admin CRUD, publish validation, atomicity, and inactive-admin denial pgTAP assertions in `supabase/tests/database/030_admin_content.test.sql`
- [ ] T030 [P] [US3] Write failing portfolio action, repository mutation, and administrator publish-flow tests in `tests/unit/portfolio/portfolio-actions.test.ts`, `tests/unit/portfolio/supabase-admin-portfolio-repository.test.ts`, and `tests/e2e/supabase-admin-content.spec.ts`
- [ ] T031 [P] [US3] Write failing site-content and pricing action tests in `tests/unit/site-content/site-content-actions.test.ts` and `tests/unit/pricing/price-actions.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Implement active-admin CRUD policies, media/video/tag limits, service consistency, publish/unpublish/soft-delete RPCs in `supabase/migrations/20260723000500_admin_content_policies.sql`
- [ ] T033 [US3] Implement site draft update, publish/version/restore RPCs and price administration policies in `supabase/migrations/20260723000600_site_content_and_prices.sql`
- [ ] T034 [US3] Implement typed, server-authorized portfolio mutations and stable result codes in `app/actions/portfolio.ts` and `features/portfolio/repository/supabase-portfolio-repository.ts`
- [ ] T035 [US3] Implement typed, server-authorized site-content and price mutations in `app/actions/site-content.ts` and `app/actions/prices.ts`
- [ ] T036 [US3] Replace local-only administrator mutations with awaited Supabase operations, pending states, and error feedback in `features/admin/portfolio/portfolio-editor-client.tsx`, `features/admin/site-content/site-content-editor-client.tsx`, and `features/admin/pricing/pricing-editor-client.tsx`
- [ ] T037 [US3] Invalidate affected public and admin routes after successful mutation in `app/actions/portfolio.ts`, `app/actions/site-content.ts`, and `app/actions/prices.ts`
- [ ] T038 [US3] Run T029-T031 and `tests/e2e/supabase-admin-content.spec.ts`, then record five-second publication and draft-isolation evidence in `specs/004-supabase-full-integration/quickstart.md`

**Checkpoint**: 관리자 수정 결과가 Supabase에 저장되고 공개 페이지 게시본에 반영된다.

---

## Phase 6: User Story 4 - 슈퍼 관리자 권한 관리 (Priority: P2)

**Goal**: 슈퍼 관리자만 기존 고객의 관리자 권한과 활성 상태를 감사 기록과 함께 변경한다.

**Independent Test**: 일반 관리자는 거부되고 슈퍼 관리자는 한 트랜잭션으로 역할과 감사 기록을 변경하며 마지막 슈퍼 관리자 보호가 작동한다.

### Tests for User Story 4

- [ ] T039 [P] [US4] Write failing super-admin authorization, immutable audit, concurrency, and last-super-admin pgTAP assertions in `supabase/tests/database/040_role_management.test.sql`
- [ ] T040 [P] [US4] Write failing server action, users-page authorization, and audited role-flow tests in `tests/unit/auth/role-actions.test.ts`, `tests/component/admin-users-page.test.tsx`, and `tests/e2e/supabase-role-management.spec.ts`

### Implementation for User Story 4

- [ ] T041 [US4] Implement super-admin profile listing and atomic `set_user_admin_role` RPC with audit and last-super-admin locking in `supabase/migrations/20260723000700_role_management.sql`
- [ ] T042 [US4] Implement super-admin-only list/change server actions with routine target-role restrictions in `app/actions/roles.ts`
- [ ] T043 [US4] Replace mock administrator user management with server-loaded profiles and audited role controls in `app/admin/(protected)/users/page.tsx` and `features/admin/users/users-manager.tsx`
- [ ] T044 [US4] Document but do not execute initial super-admin assignment in `supabase/README.md`
- [ ] T045 [US4] Run T039-T040 and `tests/e2e/supabase-role-management.spec.ts`, then record credential/elevation secret-scan evidence in `specs/004-supabase-full-integration/quickstart.md`

**Checkpoint**: 권한 부여는 슈퍼 관리자에게만 열리고 모든 변경이 감사된다.

---

## Phase 7: User Story 5 - Storage 지연 활성화 (Priority: P3)

**Goal**: Storage가 꺼진 상태에서 업로드가 fail-closed로 동작하고, 추후 검토 후 즉시 활성화할 수 있는 SQL과 운영 절차를 제공한다.

**Independent Test**: 비활성 설정에서는 Storage API 호출이 없고, 활성화 검사에서는 버킷·정책·환경 누락을 명확히 찾는다.

### Tests for User Story 5

- [ ] T046 [P] [US5] Write failing disabled-Storage adapter tests that assert zero upload calls and a 20-file batch limit in `tests/unit/storage/storage-gateway.test.ts`
- [ ] T047 [P] [US5] Write idempotence and policy-shape assertions for deferred SQL in `supabase/tests/storage/enable-storage.test.sql`

### Implementation for User Story 5

- [ ] T048 [US5] Implement fail-closed Storage gateway, 20-file client/server validation, and disabled upload UI state in `features/portfolio/storage/storage-gateway.ts` and `features/admin/portfolio/media-upload-panel.tsx`
- [ ] T049 [US5] Prepare but do not migrate private-original/public-reviewed buckets and object policies in `supabase/storage/enable-storage.sql`
- [ ] T050 [US5] Add activation, rollback, validation, plan-check, and generated-assets migration instructions in `supabase/storage/README.md`
- [ ] T051 [US5] Run T046 and static T047 checks, then verify remote migration history excludes `supabase/storage/enable-storage.sql`

**Checkpoint**: Storage는 실제 연결 없이 안전하게 대기하며 별도 승인 후 활성화할 수 있다.

---

## Phase 8: Remote Integration & Cross-Cutting Verification

**Purpose**: 로컬 구현을 검증하고 연결된 원격 프로젝트에 검토된 데이터베이스 변경만 적용한다.

- [ ] T052 [P] Update Supabase operations, auth redirect/SMTP, and deployment gates in `README.md`, `.env.example`, and `docs/superpowers/specs/2026-07-23-supabase-full-integration-design.md`
- [ ] T053 Run migration-history inspection and linked dry-run with `pnpm supabase migration list` and `pnpm supabase db push --linked --dry-run`; stop if history diverges or Storage SQL appears
- [ ] T054 Apply reviewed migrations with `pnpm supabase db push --linked` without seed/reset/Storage activation, then regenerate `lib/supabase/database.types.ts`
- [ ] T055 Run database tests where available plus `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and targeted Playwright authentication/public/admin checks
- [ ] T056 Audit tracked files and generated client bundles for database passwords, service-role keys, initial super-admin credentials, and ignored local artifacts using `.gitignore`, `git status`, and secret-pattern searches
- [ ] T057 Execute every applicable scenario in `specs/004-supabase-full-integration/quickstart.md` and record any deployment-only exclusions in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작할 수 있다.
- **Foundational (Phase 2)**: Setup 완료 후 진행하며 모든 사용자 스토리를 차단한다.
- **US1 공개 조회 (Phase 3)**: Foundational 이후 진행한다.
- **US2 고객 인증 (Phase 4)**: Foundational 이후 진행하며 보호된 관리자 UI의 전제다.
- **US3 관리자 콘텐츠 (Phase 5)**: US1 공개 투영과 US2 서버 권한 경계에 의존한다.
- **US4 권한 관리 (Phase 6)**: US2 서버 인증 경계에 의존한다.
- **US5 Storage 대기 (Phase 7)**: Foundational 이후 독립적으로 진행할 수 있으나 미디어 UI 통합은 US3 이후 검증한다.
- **Remote Integration (Phase 8)**: 구현 대상으로 선택한 모든 사용자 스토리와 검증이 끝난 뒤 진행한다.

### User Story Dependency Graph

```text
Setup → Foundation ┬→ US1 Public Reads ─┐
                   ├→ US2 Auth ─────────┼→ US3 Admin Content
                   │       └────────────┴→ US4 Role Management
                   └→ US5 Storage Prep
All selected stories → Dry-run → Reviewed remote push → Full verification
```

### Within Each User Story

- 테스트를 먼저 작성하고 기대한 이유로 실패하는지 확인한다.
- SQL 정책과 제약은 애플리케이션 어댑터보다 먼저 구현한다.
- 저장소/서버 작업을 UI에 연결한 후 공개·권한 경계의 독립 테스트를 다시 실행한다.
- 각 단계에서 전체 관련 회귀 테스트를 통과시킨 뒤 다음 단계로 이동한다.

### Parallel Opportunities

- T002-T004는 서로 다른 설정 파일 중심으로 병렬 가능하다.
- T013-T014, T020-T022, T029-T031, T039-T040, T046-T047은 각 스토리의 선행 테스트 작성으로 병렬 가능하다.
- Foundation 이후 US1·US2·US5는 독립적으로 시작할 수 있다.
- US3가 진행되는 동안 US4의 SQL/액션과 US5 문서/SQL 준비를 별도 작업자로 진행할 수 있다.

## Implementation Strategy

### MVP First

1. Phase 1 Setup 완료
2. Phase 2 Foundation 완료
3. Phase 3 US1 공개 조회 완료 및 독립 검증
4. 공개 데이터 노출 경계를 검토한 뒤 인증·관리 기능으로 확장

### Incremental Delivery

1. 스키마/RLS 기반 구축
2. 공개 조회를 운영 데이터로 전환
3. 실제 Auth와 서버 관리자 경계 도입
4. 관리자 콘텐츠 쓰기와 게시 연결
5. 슈퍼 관리자 권한 관리 도입
6. Storage 준비물을 비활성 상태로 검증
7. dry-run 검토 후 원격 적용 및 전체 검증

## Notes

- `[P]` 작업은 다른 파일을 대상으로 하며 미완료 작업에 의존하지 않는 범위에서만 병렬 수행한다.
- `supabase/storage/enable-storage.sql`은 자동 마이그레이션 경로에 두지 않고 이번 원격 push에 포함하지 않는다.
- 초기 슈퍼 관리자 계정이나 권한 부여 SQL은 실행하지 않는다.
- 연결된 프로젝트에 `db reset`, seed, Storage 활성화 SQL을 실행하지 않는다.
- 기존 localStorage 데이터는 운영 Supabase로 자동 이전하지 않는다.
