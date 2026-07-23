import { describe, expect, it, vi } from "vitest";

import { SupabaseAuthRepository } from "@/features/auth/repository/supabase-auth-repository";

function authClient(overrides: Record<string, unknown> = {}) {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "owner@example.com" }, session: { expires_at: 2_000_000_000 } },
      error: null,
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    ...overrides,
  };
  return { auth };
}

describe("SupabaseAuthRepository", () => {
  it("maps a verified customer profile into the application session", async () => {
    const client = authClient();
    const repository = new SupabaseAuthRepository(client, async () => ({
      id: "user-1",
      email: "owner@example.com",
      role: "customer",
      is_active: true,
    }));

    expect(await repository.signInCustomer({ email: " Owner@Example.com ", password: "Safe-password-2026" })).toEqual({ ok: true });
    expect(repository.getSession()).toMatchObject({ userId: "user-1", email: "owner@example.com", role: "customer", isActive: true });
  });

  it("signs an authenticated non-admin back out without disclosing their role", async () => {
    const client = authClient();
    const repository = new SupabaseAuthRepository(client, async () => ({
      id: "user-1",
      email: "owner@example.com",
      role: "customer",
      is_active: true,
    }));

    expect(await repository.signInAdmin({ email: "owner@example.com", password: "Safe-password-2026" })).toEqual({
      ok: false,
      message: "이메일 또는 비밀번호를 확인해 주세요.",
    });
    expect(client.auth.signOut).toHaveBeenCalledOnce();
    expect(repository.getSession()).toBeNull();
  });

  it("always returns the same password recovery response", async () => {
    const client = authClient({ resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: new Error("missing") }) });
    const repository = new SupabaseAuthRepository(client, async () => null, () => "https://care.example");

    await expect(repository.requestPasswordReset("missing@example.com")).resolves.toEqual({
      ok: true,
      message: "계정이 존재하면 비밀번호 재설정 안내를 보내드립니다.",
    });
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith("missing@example.com", {
      redirectTo: "https://care.example/auth/callback?next=/auth/update-password",
    });
  });
});
