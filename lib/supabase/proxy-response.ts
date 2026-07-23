import type { CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";

export interface SupabaseCookieUpdate {
  name: string;
  value: string;
  options?: CookieOptions;
}

export function applySupabaseResponseUpdates(
  response: NextResponse,
  cookiesToSet: SupabaseCookieUpdate[],
  headers: Record<string, string>,
) {
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
}
