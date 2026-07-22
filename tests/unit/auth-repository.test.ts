import { beforeEach, describe, expect, it } from "vitest";
import { BrowserAuthRepository, AUTH_ACCOUNTS_KEY, AUTH_SESSION_KEY } from "@/features/auth/repository/browser-auth-repository";

describe("BrowserAuthRepository", () => {
  beforeEach(() => localStorage.clear());

  it("creates and signs in a customer without storing the plaintext password", async () => {
    const repository = new BrowserAuthRepository(localStorage);
    const password = "Safe-password-2026";
    await repository.signUpCustomer({ email: " Owner@Example.com ", password });
    repository.signOut();
    expect(localStorage.getItem(AUTH_ACCOUNTS_KEY)).not.toContain(password);
    expect(await repository.signInCustomer({ email: "owner@example.com", password })).toEqual({ ok: true });
    expect(repository.getSession()).toMatchObject({ email: "owner@example.com", role: "customer" });
  });

  it("returns one generic error for invalid customer credentials", async () => {
    const repository = new BrowserAuthRepository(localStorage);
    expect(await repository.signInCustomer({ email: "missing@example.com", password: "wrong-password" })).toEqual({ ok: false, message: "이메일 또는 비밀번호를 확인해 주세요." });
  });

  it("never creates an administrator session before the backend is configured", async () => {
    const repository = new BrowserAuthRepository(localStorage);
    expect(await repository.signInAdmin({ email: "admin@example.com", password: "anything" })).toEqual({ ok: false, message: "관리자 인증은 Supabase 연동 후 사용할 수 있습니다." });
    expect(repository.getSession()).toBeNull();
    expect(localStorage.getItem(AUTH_ACCOUNTS_KEY) ?? "").not.toContain("super_admin");
  });

  it("rejects a forged browser administrator session", () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ email: "admin@example.com", role: "super_admin", expiresAt: new Date(Date.now() + 60_000).toISOString() }));
    expect(new BrowserAuthRepository(localStorage).getSession()).toBeNull();
  });
});
