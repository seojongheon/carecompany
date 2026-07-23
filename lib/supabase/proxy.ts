import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readPublicSupabaseEnv } from "./env";
import { applySupabaseResponseUpdates } from "./proxy-response";

export async function updateSupabaseSession(request: NextRequest) {
  const environment = readPublicSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(environment.url, environment.publishableKey, {
    cookies: {
      encode: "tokens-only",
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        applySupabaseResponseUpdates(response, cookiesToSet, headers);
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
