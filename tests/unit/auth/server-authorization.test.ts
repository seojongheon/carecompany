import { describe, expect, it, vi } from "vitest";

import { readServerAuthContext } from "@/features/auth/server/authorization";

function client(profile: unknown, user = { id: "user-1", email: "owner@example.com" }) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockReturnValue({ select }),
  };
}

describe("readServerAuthContext", () => {
  it("trusts the current profile role instead of user metadata", async () => {
    const supabase = client({ id: "user-1", email: "owner@example.com", role: "customer", is_active: true });
    const context = await readServerAuthContext(supabase);
    expect(context).toMatchObject({ userId: "user-1", role: "customer", isActive: true, canAccessAdmin: false });
  });

  it("allows only active administrators", async () => {
    await expect(readServerAuthContext(client({ id: "user-1", email: "admin@example.com", role: "admin", is_active: true }))).resolves.toMatchObject({ canAccessAdmin: true, canManageAdministrators: false });
    await expect(readServerAuthContext(client({ id: "user-1", email: "super@example.com", role: "super_admin", is_active: true }))).resolves.toMatchObject({ canAccessAdmin: true, canManageAdministrators: true });
    await expect(readServerAuthContext(client({ id: "user-1", email: "admin@example.com", role: "admin", is_active: false }))).resolves.toMatchObject({ canAccessAdmin: false });
  });

  it("fails closed when the verified user or profile is missing", async () => {
    await expect(readServerAuthContext(client(null))).resolves.toBeNull();
    await expect(readServerAuthContext(client(null, null as never))).resolves.toBeNull();
  });
});
