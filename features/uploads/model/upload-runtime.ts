import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import type { PortfolioRepository } from "@/features/portfolio/repository/portfolio-repository";

export type UploadRuntime = "supabase" | "deferred" | "mock";

export function getUploadRuntime(repository: PortfolioRepository, storageEnabled: boolean): UploadRuntime {
  if (!(repository instanceof SupabasePortfolioRepository)) return "mock";
  return storageEnabled ? "supabase" : "deferred";
}
