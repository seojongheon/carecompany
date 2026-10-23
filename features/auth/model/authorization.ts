import type { AuthSession } from "./types";

export function canAccessAdmin(session: AuthSession | null) {
  return session?.isActive !== false && (session?.role === "admin" || session?.role === "super_admin");
}

export function canManageAdministrators(session: AuthSession | null) {
  return session?.isActive !== false && session?.role === "super_admin";
}
