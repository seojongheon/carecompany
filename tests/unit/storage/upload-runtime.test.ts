import { describe, expect, it } from "vitest";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { getUploadRuntime } from "@/features/uploads/model/upload-runtime";

describe("getUploadRuntime", () => {
  it("uses real Supabase persistence in development whenever Storage is enabled", () => {
    const repository = new SupabasePortfolioRepository({} as never);

    expect(getUploadRuntime(repository, true)).toBe("supabase");
  });

  it("keeps local mock persistence only for an explicitly injected local repository", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);

    expect(getUploadRuntime(repository, true)).toBe("mock");
  });

  it("fails closed when Supabase Storage is disabled", () => {
    const repository = new SupabasePortfolioRepository({} as never);

    expect(getUploadRuntime(repository, false)).toBe("deferred");
  });
});
