import { describe, expect, it, vi } from "vitest";

import { listAdminProfilesWithClient, setUserAdminRoleWithClient } from "@/app/actions/roles";

describe("administrator role actions", () => {
  it("returns the restricted profile projection from the trusted RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ id: "user-1", email: "customer@example.com", display_name: null, role: "customer", is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" }], error: null });
    await expect(listAdminProfilesWithClient({ rpc })).resolves.toEqual({ ok: true, data: expect.any(Array) });
    expect(rpc).toHaveBeenCalledWith("list_admin_profiles");
  });

  it("rejects super-admin assignment and short audit reasons before RPC", async () => {
    const rpc = vi.fn();
    await expect(setUserAdminRoleWithClient({ rpc }, { targetId: "11111111-1111-4111-8111-111111111111", newRole: "super_admin" as never, active: true, reason: "운영 승인" })).resolves.toMatchObject({ ok: false, code: "invalid_request" });
    await expect(setUserAdminRoleWithClient({ rpc }, { targetId: "11111111-1111-4111-8111-111111111111", newRole: "admin", active: true, reason: "x" })).resolves.toMatchObject({ ok: false, code: "invalid_request" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses one audited RPC and returns a generic denial on database errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: "42501", message: "active_super_admin_required" } });
    await expect(setUserAdminRoleWithClient({ rpc }, { targetId: "11111111-1111-4111-8111-111111111111", newRole: "admin", active: true, reason: "운영 담당자 승인" })).resolves.toEqual({ ok: false, code: "forbidden", message: "권한 변경이 허용되지 않았습니다." });
    expect(rpc).toHaveBeenCalledOnce();
  });
});
