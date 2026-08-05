# Role-Aware Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 홈페이지 헤더가 로그인 세션의 역할에 따라 로그인 링크, 관리자 대시보드 링크, 고객용 비활성 대시보드 버튼을 표시하도록 만든다.

**Architecture:** 기존 `CustomerAuthNav`를 역할별 표시의 단일 책임 컴포넌트로 유지한다. `AuthProvider`가 공급하는 `AuthSession`만 읽고, 데스크톱 `Header`와 모바일 `MobileMenu`는 현재처럼 같은 컴포넌트를 재사용한다.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest 4, Testing Library

## Global Constraints

- 비로그인 사용자는 `로그인` 링크로 `/login`에 이동한다.
- `admin`과 `super_admin` 사용자는 `대시보드` 링크로 `/admin`에 이동한다.
- `customer` 사용자는 링크가 없는 비활성 `대시보드` 버튼을 본다.
- 고객 버튼은 `고객 대시보드 준비 중` 상태를 보조 기술에 전달한다.
- 고객 대시보드 페이지, 인증 저장소, Supabase 권한 로직은 변경하지 않는다.
- 데스크톱과 모바일의 기존 내비게이션 스타일을 유지한다.
- 프로젝트 소유자의 정책에 따라 이 계획과 구현 결과를 자동으로 Git 커밋하지 않는다.

---

## File Structure

- Create: `tests/component/customer-auth-nav.test.tsx` — 역할별 내비게이션 렌더링 계약을 검증한다.
- Modify: `features/auth/ui/customer-auth-nav.tsx` — 현재 세션 역할을 접근 가능한 링크 또는 비활성 버튼으로 변환한다.

### Task 1: 역할 기반 대시보드 내비게이션

**Files:**
- Create: `tests/component/customer-auth-nav.test.tsx`
- Modify: `features/auth/ui/customer-auth-nav.tsx`

**Interfaces:**
- Consumes: `useOptionalAuth(): AuthValue | null`, `AuthSession`, 기존 `mobile?: boolean` 속성
- Produces: `CustomerAuthNav({ mobile?: boolean }): React.JSX.Element`

- [ ] **Step 1: 역할별 동작을 정의하는 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/repository/auth-provider";
import type { AuthRepository, AuthSession } from "@/features/auth/model/types";
import { CustomerAuthNav } from "@/features/auth/ui/customer-auth-nav";

function repositoryWith(session: AuthSession | null): AuthRepository {
  return {
    getSession: () => session,
    subscribe: () => () => undefined,
    signUpCustomer: async () => ({ ok: false, message: "unused" }),
    signInCustomer: async () => ({ ok: false, message: "unused" }),
    signInAdmin: async () => ({ ok: false, message: "unused" }),
    requestPasswordReset: async () => ({ ok: true, message: "unused" }),
    signOut: () => undefined,
  };
}

function authSession(role: AuthSession["role"]): AuthSession {
  return {
    email: `${role}@example.com`,
    role,
    isActive: true,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function renderNav(session: AuthSession | null, mobile = false) {
  render(
    <AuthProvider repository={repositoryWith(session)}>
      <CustomerAuthNav mobile={mobile} />
    </AuthProvider>,
  );
}

describe("CustomerAuthNav", () => {
  it("links anonymous visitors to login", () => {
    renderNav(null);
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });

  it("shows customers a disabled dashboard button without a link", () => {
    renderNav(authSession("customer"));
    expect(screen.queryByRole("link", { name: /대시보드/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /고객 대시보드 준비 중/ })).toBeDisabled();
  });

  it.each(["admin", "super_admin"] as const)("links %s users to the admin dashboard", (role) => {
    renderNav(authSession(role));
    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute("href", "/admin");
  });

  it("keeps the customer dashboard disabled in the mobile variant", () => {
    renderNav(authSession("customer"), true);
    expect(screen.getByRole("button", { name: /고객 대시보드 준비 중/ })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /대시보드/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 새 테스트가 기존 동작 때문에 실패하는지 확인**

Run: `pnpm exec vitest run tests/component/customer-auth-nav.test.tsx`

Expected: 고객 상태가 현재 `/account`의 `내 계정` 링크를 출력하고 관리자 상태가 `/login`의 `로그인` 링크를 출력하므로 FAIL.

- [ ] **Step 3: 최소 역할 분기 구현**

`features/auth/ui/customer-auth-nav.tsx`를 다음과 같이 변경한다.

```tsx
"use client";

import Link from "next/link";
import { useOptionalAuth } from "../repository/auth-provider";

export function CustomerAuthNav({ mobile = false }: { mobile?: boolean }) {
  const session = useOptionalAuth()?.session ?? null;
  const className = mobile
    ? "flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]"
    : "nav-link";

  if (session?.role === "customer") {
    return (
      <button
        type="button"
        className={`${className} cursor-not-allowed opacity-50`}
        disabled
        aria-label="대시보드 - 고객 대시보드 준비 중"
      >
        대시보드
      </button>
    );
  }

  if (session?.role === "admin" || session?.role === "super_admin") {
    return <Link className={className} href="/admin">대시보드</Link>;
  }

  return <Link className={className} href="/login">로그인</Link>;
}
```

- [ ] **Step 4: 역할별 컴포넌트 테스트 통과 확인**

Run: `pnpm exec vitest run tests/component/customer-auth-nav.test.tsx`

Expected: 4 tests PASS.

- [ ] **Step 5: 관련 인증·공개 헤더 회귀 테스트 실행**

Run: `pnpm exec vitest run tests/component/customer-auth-nav.test.tsx tests/component/auth-flows.test.tsx tests/component/public-browse.test.tsx`

Expected: 모든 선택 테스트 PASS.

- [ ] **Step 6: 정적 검사와 전체 테스트 실행**

Run: `pnpm lint`

Expected: exit code 0, 경고 없음.

Run: `pnpm typecheck`

Expected: exit code 0.

Run: `pnpm test`

Expected: 전체 테스트 PASS.

- [ ] **Step 7: 실제 페이지의 데스크톱·모바일 상태 확인**

개발 서버가 실행 중이면 깨끗한 브라우저 세션에서 비로그인 헤더의 `로그인` 링크를 확인한다. 테스트 세션으로 고객과 관리자 역할을 재현할 수 있으면 고객 버튼이 비활성이고 관리자 링크가 `/admin`으로 이동하는지도 확인한다.

Expected: 자동 테스트의 역할별 계약과 실제 헤더 표시가 일치하며 hydration 또는 콘솔 오류가 없다.

- [ ] **Step 8: 변경 범위 확인**

Run: `git diff -- features/auth/ui/customer-auth-nav.tsx tests/component/customer-auth-nav.test.tsx`

Expected: 역할 기반 내비게이션 구현과 전용 테스트 외 변경 없음. Git 커밋은 생성하지 않는다.
