import { describe, expect, it } from "vitest";

import { readPublicSupabaseEnv } from "@/lib/supabase/env";

describe("readPublicSupabaseEnv", () => {
  it("returns normalized public connection values with Storage disabled by default", () => {
    expect(readPublicSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_test ",
    })).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
      storageEnabled: false,
    });
  });

  it("rejects missing or non-Supabase connection values", () => {
    expect(() => readPublicSupabaseEnv({})).toThrow("Supabase 공개 환경변수");
    expect(() => readPublicSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "javascript:alert(1)",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
    })).toThrow("Supabase URL");
  });

  it("enables Storage only for an explicit true flag", () => {
    expect(readPublicSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED: "true",
    }).storageEnabled).toBe(true);
  });
});
