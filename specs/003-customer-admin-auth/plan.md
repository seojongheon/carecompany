# Implementation Plan: 고객·관리자 인증 경계

**Branch**: `003-customer-admin-auth` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

## Summary

고객 인증 UI와 상태 전이를 typed `AuthRepository` 뒤에 둔다. 현재 어댑터는 고객 데모 계정의 이메일과 비밀번호 검증용 salt/digest만 브라우저 저장소에 보관하고, 관리자·슈퍼 관리자 계정 또는 성공 세션은 만들지 않는다. 관리자 경로는 클라이언트 가드로 잠그며 향후 Supabase 어댑터와 서버 가드가 같은 UI 계약을 대체한다.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Next.js 16  
**Primary Dependencies**: Next App Router, React Hook Form, Zod, Web Crypto  
**Storage**: 고객 목업 계정의 정규화 이메일·salt·digest 및 세션만 브라우저 저장소에 저장; 관리자 자격 증명 없음  
**Testing**: Vitest unit/component, Playwright E2E, lint, typecheck, build  
**Target Platform**: 390px·1440px 웹 브라우저  
**Project Type**: Next.js 단일 웹 애플리케이션  
**Performance Goals**: 제출 상태 즉시 표시, 중복 제출 방지, 세션 변경 즉시 반영  
**Constraints**: 실제 Supabase 미연동; 관리자·슈퍼 계정 생성 금지; 관리자 성공 세션 금지; 클라이언트 가드는 비운영용  
**Scale/Scope**: 고객 로그인·가입·재설정·계정, 관리자 로그인·가드, 슈퍼 관리자 권한 관리 잠금 화면

## Constitution Check

- PRD authority: 통과. 인증 범위가 PRD에 반영되었다.
- Frontend boundary: 통과. Constitution 1.1.0의 제한된 mock auth 허용 범위를 따른다.
- Test-first: 통과 조건. 저장소·폼·가드 테스트를 먼저 실패시킨다.
- Accessibility/responsive: 통과 조건. 390px·1440px와 키보드 흐름을 검증한다.
- Deferred integration: 통과. Supabase 전환과 운영 보안을 체크리스트에 기록한다.

## Project Structure

```text
app/
├── (site)/login/
├── (site)/signup/
├── (site)/forgot-password/
├── (site)/account/
├── admin/login/
└── admin/users/
features/auth/
├── model/
├── repository/
└── ui/
components/admin/admin-auth-guard.tsx
tests/unit/auth-repository.test.ts
tests/component/auth-flows.test.tsx
```

**Structure Decision**: 인증 기능을 `features/auth`에 격리하고 고객·관리자 화면이 공통 계약과 시각 컴포넌트를 재사용한다.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Constitution 1.1.0 개정 | 사용자가 인증 기능과 관리자 접근 차단을 승인함 | 1.0.0은 인증 모형과 관리자 가드를 모두 금지함 |

