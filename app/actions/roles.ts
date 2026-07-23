"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ManagedProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: "customer" | "admin" | "super_admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RpcClient {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;
}

const RoleChangeSchema = z.object({
  targetId: z.string().uuid(),
  newRole: z.enum(["customer", "admin"]),
  active: z.boolean(),
  reason: z.string().trim().min(3).max(500),
});

export async function listAdminProfilesWithClient(client: RpcClient) {
  const { data, error } = await client.rpc("list_admin_profiles");
  if (error) return { ok: false as const, code: "forbidden", message: "관리자 목록을 조회할 권한이 없습니다." };
  return { ok: true as const, data: data as ManagedProfile[] };
}

export async function setUserAdminRoleWithClient(
  client: RpcClient,
  input: { targetId: string; newRole: "customer" | "admin"; active: boolean; reason: string },
) {
  const parsed = RoleChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, code: "invalid_request", message: "역할과 변경 사유를 확인해 주세요." };

  const { data, error } = await client.rpc("set_user_admin_role", {
    target_id: parsed.data.targetId,
    new_role: parsed.data.newRole,
    active: parsed.data.active,
    reason: parsed.data.reason,
  });
  if (error) return { ok: false as const, code: error.code === "42501" ? "forbidden" : "role_change_failed", message: "권한 변경이 허용되지 않았습니다." };
  return { ok: true as const, data: data as ManagedProfile };
}

export async function listAdminProfiles() {
  return listAdminProfilesWithClient(await createServerSupabaseClient());
}

export async function setUserAdminRole(input: { targetId: string; newRole: "customer" | "admin"; active: boolean; reason: string }) {
  const result = await setUserAdminRoleWithClient(await createServerSupabaseClient(), input);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}
