import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import type { PortfolioRepository } from "@/features/portfolio/repository/portfolio-repository";

export type UploadRuntime = "supabase" | "development" | "deferred" | "mock";

export function isSupabaseStorageAllowed(
  storageEnabled: boolean,
  environment: string | undefined = process.env.NODE_ENV,
) {
  return storageEnabled && environment === "production";
}

export function getUploadRuntime(
  repository: PortfolioRepository,
  storageEnabled: boolean,
  environment: string | undefined = process.env.NODE_ENV,
): UploadRuntime {
  if (!(repository instanceof SupabasePortfolioRepository)) return "mock";
  if (environment !== "production") return "development";
  return isSupabaseStorageAllowed(storageEnabled, environment) ? "supabase" : "deferred";
}
