# Tasks: 로그인 후 HTTP 431 복구

**Input**: Design documents from `/specs/005-fix-http-431/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/http-header-boundary.md

## Phase 1: User Story 1 - 로그인 후 홈페이지 재접속 (Priority: P1)

**Goal**: 16KB를 넘는 정상 범위 요청이 Node HTTP 파서에서 차단되지 않게 한다.

**Independent Test**: 새 런타임으로 실행한 HTTP 서버가 32KB 요청을 처리하고 70KB 요청을 431로 거부한다.

- [ ] T001 [US1] `tests/integration/http-header-runtime.test.ts`에 dev/start 실행 스크립트가 65,536바이트 한도를 사용하는 실패 테스트 추가
- [ ] T002 [US1] T001 테스트를 실행해 현재 `next dev`와 `next start` 설정 때문에 실패하는지 확인
- [ ] T003 [US1] `package.json`의 dev/start 스크립트에 Node `--max-http-header-size=65536` 플래그 적용
- [ ] T004 [US1] 전용 테스트와 기존 전체 테스트·린트·타입 검사를 실행
- [ ] T005 [US1] 기존 개발 서버를 재시작하고 localhost에 정상·17KB·32KB·70KB 요청을 보내 경계값 검증
- [ ] T006 [US1] `/`, `/login`, `/admin/login` 응답과 Playwright 인증 흐름 및 프로덕션 빌드 검증

## Dependencies

- T001 → T002 → T003 → T004 → T005 → T006

## Implementation Strategy

TDD로 설정 계약을 먼저 고정하고 최소한의 실행 스크립트 변경만 적용한다. 인증·쿠키·DB 코드는 변경하지 않는다.
