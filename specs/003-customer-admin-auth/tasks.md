# Tasks: 고객·관리자 인증 경계

## Phase 1: Setup

- [x] T001 Update deferred authentication boundaries in `docs/project/deferred-backend-integration.md`

## Phase 2: Foundational

- [x] T002 Write failing mock repository tests in `tests/unit/auth-repository.test.ts`
- [x] T003 Implement auth types, validation, repository contract, and browser adapter in `features/auth/model/types.ts`, `features/auth/model/schemas.ts`, `features/auth/repository/auth-repository.ts`, and `features/auth/repository/browser-auth-repository.ts`
- [x] T004 Implement auth provider and session hook in `features/auth/repository/auth-provider.tsx`
- [x] T005 Integrate the auth provider in `app/layout.tsx`

## Phase 3: User Story 1 - 고객 회원가입과 로그인 (P1)

- [x] T006 [US1] Write failing customer auth component tests in `tests/component/auth-flows.test.tsx`
- [x] T007 [US1] Implement shared customer auth shell and forms in `features/auth/ui/auth-shell.tsx`, `features/auth/ui/customer-login-form.tsx`, and `features/auth/ui/customer-signup-form.tsx`
- [x] T008 [US1] Add customer routes in `app/(site)/login/page.tsx`, `app/(site)/signup/page.tsx`, and `app/(site)/account/page.tsx`
- [x] T009 [US1] Add customer login/account navigation in `components/site/header.tsx` and `components/site/mobile-menu.tsx`

## Phase 4: User Story 2 - 고객 비밀번호 재설정 (P2)

- [x] T010 [US2] Write failing reset privacy and duplicate-submit tests in `tests/component/auth-flows.test.tsx`
- [x] T011 [US2] Implement reset form and route in `features/auth/ui/password-reset-form.tsx` and `app/(site)/forgot-password/page.tsx`

## Phase 5: User Story 3 - 관리자 로그인과 접근 차단 (P1)

- [x] T012 [US3] Write failing administrator lock and no-signup tests in `tests/component/admin-auth.test.tsx`
- [x] T013 [US3] Implement administrator login locked state in `features/auth/ui/admin-login-form.tsx` and `app/admin/login/page.tsx`
- [x] T014 [US3] Implement the mock administrator guard in `components/admin/admin-auth-guard.tsx` and integrate it in `app/admin/layout.tsx`

## Phase 6: User Story 4 - 슈퍼 관리자 권한 관리 (P3)

- [x] T015 [US4] Write failing locked-role-management tests in `tests/component/admin-auth.test.tsx`
- [x] T016 [US4] Implement the Supabase-pending lock screen in `app/admin/users/page.tsx`

## Phase 7: Verification

- [x] T017 Run tests, lint, typecheck, build, and responsive route checks from `specs/003-customer-admin-auth/quickstart.md`

## Dependencies

T002–T005 block all UI stories. US1 and US3 are the MVP. US2 depends on the shared customer shell. US4 remains a locked state until Supabase integration.
