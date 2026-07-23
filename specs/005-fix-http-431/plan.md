# Implementation Plan: 로그인 후 HTTP 431 복구

**Branch**: `main` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

## Summary

Node HTTP 파서의 기본 16KB 요청 헤더 한도가 로그인 이후 브라우저 요청을 Next.js보다 먼저 차단한다. `dev`와 `start`를 64KB의 명시적 상한으로 실행하고, 실제 하위 프로세스가 이 한도를 적용하는지 자동 회귀 테스트와 localhost 요청으로 검증한다.

## Technical Context

**Language/Version**: Node.js 24 LTS, TypeScript 5.9

**Primary Dependencies**: Next.js 16.2.11, React 19.2.8, Supabase SSR 0.12.3

**Storage**: 변경 없음

**Testing**: Vitest, Node HTTP 통합 프로브, Playwright 기존 흐름

**Target Platform**: macOS/Linux 로컬 개발 및 Node 자체 호스팅

**Project Type**: Next.js 웹 애플리케이션

**Performance Goals**: 32KB 요청 헤더를 정상 처리하고 64KB 초과 요청은 거부

**Constraints**: 헤더 한도를 무제한으로 늘리지 않으며 인증·RLS·쿠키 인코딩 정책을 변경하지 않음

**Scale/Scope**: `package.json` 실행 스크립트와 전용 런타임 회귀 테스트

## Constitution Check

- PRD 범위와 충돌 없음.
- Supabase 신뢰 경계와 RLS를 변경하지 않음.
- Red-Green-Refactor로 설정 회귀 테스트를 먼저 작성함.
- 사용자 화면과 접근성 구조를 변경하지 않음.
- 완료 전 전체 테스트, 린트, 타입 검사, Playwright 흐름과 프로덕션 빌드를 실행함.

## Project Structure

```text
package.json
tests/
└── integration/
    └── http-header-runtime.test.ts
specs/005-fix-http-431/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── contracts/
│   └── http-header-boundary.md
└── tasks.md
```

**Structure Decision**: 별도 커스텀 서버를 만들지 않고 Node가 공식 지원하는 런타임 플래그를 Next CLI 실행에 직접 적용한다.

## Complexity Tracking

헌법 위반이나 추가 복잡성은 없다.
