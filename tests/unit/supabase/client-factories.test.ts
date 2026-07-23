import { describe, expect, it, vi } from "vitest";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

describe("Supabase client factories", () => {
  it("uses public credentials and stores only auth tokens in browser cookies", () => {
    const client = { marker: "browser" };
    const factory = vi.fn().mockReturnValue(client);

    expect(createBrowserSupabaseClient(factory, {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      SUPABASE_DATABASE_PASSWORD: "must-not-be-forwarded",
    })).toBe(client);
    expect(factory).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test",
      expect.objectContaining({
        auth: expect.objectContaining({
          userStorage: expect.objectContaining({
            getItem: expect.any(Function),
            removeItem: expect.any(Function),
            setItem: expect.any(Function),
          }),
        }),
        cookies: expect.objectContaining({
          encode: "tokens-only",
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    const options = factory.mock.calls[0]?.[2];
    expect(options.auth.userStorage.getItem("missing")).toBeNull();
    expect(options.cookies.getAll()).toEqual([]);
    expect(() => options.cookies.setAll([
      { name: "sb-test", value: "token", options: { path: "/" } },
    ], {})).not.toThrow();
  });
});
