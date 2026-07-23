import { describe, expect, it, vi } from "vitest";

import { applySupabaseResponseUpdates } from "@/lib/supabase/proxy-response";

describe("applySupabaseResponseUpdates", () => {
  it("forwards Supabase session cookies and cache-control headers together", () => {
    const response = {
      cookies: { set: vi.fn() },
      headers: { set: vi.fn() },
    };

    applySupabaseResponseUpdates(response as never, [
      { name: "sb-project-auth-token", value: "session", options: { path: "/" } },
    ], { "cache-control": "private, no-store", pragma: "no-cache" });

    expect(response.cookies.set).toHaveBeenCalledWith("sb-project-auth-token", "session", { path: "/" });
    expect(response.headers.set).toHaveBeenCalledWith("cache-control", "private, no-store");
    expect(response.headers.set).toHaveBeenCalledWith("pragma", "no-cache");
  });
});
