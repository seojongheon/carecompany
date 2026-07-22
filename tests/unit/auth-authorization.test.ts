import { describe, expect, it } from "vitest";
import { canAccessAdmin, canManageAdministrators } from "@/features/auth/model/authorization";
import type { AuthSession } from "@/features/auth/model/types";

const session = (role: AuthSession["role"]): AuthSession => ({
  email: `${role}@example.com`,
  role,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
});

describe("administrator authorization", () => {
  it("rejects anonymous and customer sessions from the administrator area", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(session("customer"))).toBe(false);
  });

  it("reserves role management for super administrators", () => {
    expect(canAccessAdmin(session("admin"))).toBe(true);
    expect(canManageAdministrators(session("admin"))).toBe(false);
    expect(canManageAdministrators(session("super_admin"))).toBe(true);
  });
});
