import { describe, expect, it } from "vitest";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { getUploadRuntime, isSupabaseStorageAllowed } from "@/features/uploads/model/upload-runtime";

describe("getUploadRuntime", () => {
  it("locks Supabase Storage in development and test environments", () => {
    const repository = new SupabasePortfolioRepository({} as never);

    expect(isSupabaseStorageAllowed(true, "development")).toBe(false);
    expect(isSupabaseStorageAllowed(true, "test")).toBe(false);
    expect(getUploadRuntime(repository, true, "development")).toBe("development");
  });

  it("uses Supabase Storage only in enabled production", () => {
    const repository = new SupabasePortfolioRepository({} as never);

    expect(isSupabaseStorageAllowed(true, "production")).toBe(true);
    expect(getUploadRuntime(repository, true, "production")).toBe("supabase");
  });

  it("keeps local mock persistence only for an explicitly injected local repository", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);

    expect(getUploadRuntime(repository, true, "development")).toBe("mock");
  });

  it("fails closed when Supabase Storage is disabled", () => {
    const repository = new SupabasePortfolioRepository({} as never);

    expect(getUploadRuntime(repository, false, "production")).toBe("deferred");
  });
});
