import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), auth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createServiceSupabaseClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/features/auth/server/authorization", () => ({ getServerAuthContext: mocks.auth }));
import { POST } from "@/app/api/analytics/route";
const event = { eventId: "10000000-0000-4000-8000-000000000011", visitorId: "10000000-0000-4000-8000-000000000012", sessionId: "10000000-0000-4000-8000-000000000013", consent: true, path: "/portfolio", referrer: "direct", device: "mobile", campaign: null };
const request = (body: unknown, origin = "https://example.test") => new Request("https://example.test/api/analytics", { method: "POST", headers: { Origin: origin, "x-real-ip": "192.0.2.10" }, body: typeof body === "string" ? body : JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("SUPABASE_SECRET_KEY", "test-only-secret"); mocks.auth.mockResolvedValue(null); mocks.rpc.mockResolvedValue({ error: null }); });
describe("analytics server boundary", () => {
  it("rejects malformed JSON without treating it as an outage", async () => { expect((await POST(request("{"))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("requires explicit consent and rejects private routes and extra fields", async () => {
    for (const patch of [{ consent: false }, { campaign: "01012345678" }, { path: "/account" }, { email: "private@example.test" }, { path: "/portfolio?phone=010" }]) expect((await POST(request({ ...event, ...patch }))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("ignores staff and cross-origin traffic", async () => {
    expect((await POST(request(event, "https://elsewhere.test"))).status).toBe(403);
    mocks.auth.mockResolvedValue({ role: "admin" }); expect((await POST(request(event))).status).toBe(204); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("passes only sanitized events and a rotating address hash", async () => {
    expect((await POST(request(event))).status).toBe(204);
    const args = mocks.rpc.mock.calls[0][1]; expect(args.event).toEqual(event); expect(args.rate_key).toMatch(/^[a-f0-9]{64}$/); expect(JSON.stringify(args)).not.toContain("192.0.2.10");
  });
});
