import { LockKeyhole } from "lucide-react";

import { listAdminProfiles } from "@/app/actions/roles";
import { UsersManager } from "@/features/admin/users/users-manager";
import { getServerAuthContext } from "@/features/auth/server/authorization";

export default async function AdminUsersPage() {
  const context = await getServerAuthContext();
  if (!context?.canManageAdministrators) return <section><p className="text-sm font-black text-[var(--brand-700)]">권한 관리</p><h1 className="mt-2 text-3xl font-black">관리자 계정</h1><div className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><LockKeyhole className="text-amber-800" aria-hidden="true" /><h2 className="mt-4 text-xl font-black text-amber-950">슈퍼 관리자 전용 기능입니다</h2><p className="mt-2 leading-7 text-amber-900">기존 고객 계정의 관리자 권한은 활성 슈퍼 관리자만 변경할 수 있습니다.</p></div></section>;

  const result = await listAdminProfiles();
  return <section><p className="text-sm font-black text-[var(--brand-700)]">권한 관리</p><h1 className="mt-2 text-3xl font-black">관리자 계정</h1><p className="mt-2 text-[var(--neutral-500)]">고객 계정에 관리자 권한을 부여하거나 회수합니다. 모든 변경은 감사 기록에 남습니다.</p>{result.ok ? <UsersManager profiles={result.data} /> : <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{result.message}</p>}</section>;
}
