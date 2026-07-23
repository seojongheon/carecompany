import { z } from "zod";

const PublicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url("Supabase URL 형식이 올바르지 않습니다."),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED: z.string().optional(),
});

export interface PublicSupabaseEnvironment {
  url: string;
  publishableKey: string;
  storageEnabled: boolean;
}

function browserVisibleEnvironment(): Record<string, string | undefined> {
  // Next.js only injects NEXT_PUBLIC_* values into browser bundles when each
  // property is referenced statically. Passing process.env as an object leaves
  // these values undefined after hydration.
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED,
  };
}

export function readPublicSupabaseEnv(
  source: Record<string, string | undefined> = browserVisibleEnvironment(),
): PublicSupabaseEnvironment {
  const result = PublicEnvironmentSchema.safeParse(source);
  if (!result.success) {
    const hasUrlIssue = result.error.issues.some((issue) => issue.path[0] === "NEXT_PUBLIC_SUPABASE_URL" && source.NEXT_PUBLIC_SUPABASE_URL);
    throw new Error(hasUrlIssue ? "Supabase URL 형식이 올바르지 않습니다." : "Supabase 공개 환경변수가 설정되지 않았습니다.");
  }

  const parsedUrl = new URL(result.data.NEXT_PUBLIC_SUPABASE_URL);
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
    throw new Error("Supabase URL은 HTTPS 주소여야 합니다.");
  }

  return {
    url: result.data.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, ""),
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    storageEnabled: result.data.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true",
  };
}
