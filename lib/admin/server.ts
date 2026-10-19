import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerAuthContext } from "@/features/auth/server/authorization";

export async function requireStaff(superOnly = false) {
  const client = await createServerSupabaseClient();
  const context = await readServerAuthContext(client as unknown as Parameters<typeof readServerAuthContext>[0]);
  if (!context?.canAccessAdmin || (superOnly && !context.canManageAdministrators)) {
    throw new Error("이 작업을 수행할 권한이 없습니다.");
  }
  return { client, context };
}
