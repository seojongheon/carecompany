import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AuthProvider } from "@/features/auth/repository/auth-provider";
import { AUTH_SESSION_KEY, BrowserAuthRepository } from "@/features/auth/repository/browser-auth-repository";

let pathname = "/admin";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("administrator access boundary", () => {
  beforeEach(() => { localStorage.clear(); pathname = "/admin"; });

  it("keeps the administrator area locked even with a forged browser role", () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ email: "owner@example.com", role: "super_admin", expiresAt: new Date(Date.now() + 60_000).toISOString() }));
    render(<AuthProvider repository={new BrowserAuthRepository(localStorage)}><AdminAuthGuard><div>비공개 관리자 화면</div></AdminAuthGuard></AuthProvider>);
    expect(screen.getByRole("heading", { name: "관리자 인증이 필요합니다" })).toBeInTheDocument();
    expect(screen.queryByText("비공개 관리자 화면")).not.toBeInTheDocument();
  });

  it("allows the dedicated login route without exposing administrator content", () => {
    pathname = "/admin/login";
    render(<AuthProvider repository={new BrowserAuthRepository(localStorage)}><AdminAuthGuard><div>관리자 로그인 폼</div></AdminAuthGuard></AuthProvider>);
    expect(screen.getByText("관리자 로그인 폼")).toBeInTheDocument();
  });
});
