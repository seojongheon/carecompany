"use client";

import { LockKeyhole } from "lucide-react";
import { canManageAdministrators } from "@/features/auth/model/authorization";
import { useAuth } from "@/features/auth/repository/auth-provider";

export default function AdminUsersPage() {
  const { session } = useAuth();
  const allowed = canManageAdministrators(session);
  return <section><p className="text-sm font-black text-[var(--brand-700)]">권한 관리</p><h1 className="mt-2 text-3xl font-black">관리자 계정</h1><div className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><LockKeyhole className="text-amber-800" aria-hidden="true" /><h2 className="mt-4 text-xl font-black text-amber-950">{allowed ? "Supabase 연결이 필요합니다" : "슈퍼 관리자 전용 기능입니다"}</h2><p className="mt-2 leading-7 text-amber-900">기존 고객 계정에 관리자 권한을 부여하거나 회수하는 기능은 Supabase 연동 후 활성화됩니다. 초기 슈퍼 계정은 이 코드에 포함하지 않으며 배포 절차에서 별도로 생성합니다.</p></div></section>;
}
