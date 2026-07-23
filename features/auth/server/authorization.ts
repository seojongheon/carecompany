import type { AuthRole } from "../model/types";

interface ServerAuthorizationClient {
  auth: {
    getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: unknown }>;
  };
  from(table: "profiles"): {
    select(columns: string): {
      eq(column: "id", value: string): {
        maybeSingle(): Promise<{ data: { id: string; email: string; role: AuthRole; is_active: boolean } | null; error: unknown }>;
      };
    };
  };
}

export interface ServerAuthContext {
  userId: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  canAccessAdmin: boolean;
  canManageAdministrators: boolean;
}

export async function readServerAuthContext(client: ServerAuthorizationClient): Promise<ServerAuthContext | null> {
  const { data: userData, error: userError } = await client.auth.getUser();
  const user = userData.user;
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,email,role,is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.id !== user.id) return null;

  const isActiveAdministrator = profile.is_active && (profile.role === "admin" || profile.role === "super_admin");
  return {
    userId: profile.id,
    email: profile.email || user.email || "",
    role: profile.role,
    isActive: profile.is_active,
    canAccessAdmin: isActiveAdministrator,
    canManageAdministrators: profile.is_active && profile.role === "super_admin",
  };
}

export async function getServerAuthContext() {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  return readServerAuthContext(await createServerSupabaseClient() as unknown as ServerAuthorizationClient);
}
