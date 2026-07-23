"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setUserAdminRole, type ManagedProfile } from "@/app/actions/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UsersManager({ profiles }: { profiles: ManagedProfile[] }) {
  if (profiles.length === 0) return <p className="mt-8 rounded-2xl border bg-white p-6">등록된 고객 계정이 없습니다.</p>;
  return <div className="mt-8 grid gap-4">{profiles.map((profile) => <UserRoleCard key={profile.id} profile={profile} />)}</div>;
}

function UserRoleCard({ profile }: { profile: ManagedProfile }) {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "admin">(profile.role === "admin" ? "admin" : "customer");
  const [active, setActive] = useState(profile.is_active);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const immutableSuperAdmin = profile.role === "super_admin";

  return <article className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">{profile.display_name || profile.email}</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">{profile.email}</p></div><span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-bold">{profile.role}</span></div>
    {immutableSuperAdmin ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">슈퍼 관리자 변경은 웹 화면에서 지원하지 않습니다.</p> : <div className="mt-5 grid gap-4 md:grid-cols-[180px_140px_1fr_auto] md:items-end">
      <div><Label htmlFor={`role-${profile.id}`}>권한</Label><select id={`role-${profile.id}`} className="min-h-11 w-full rounded-xl border px-3" value={role} onChange={(event) => setRole(event.target.value as "customer" | "admin")}><option value="customer">고객</option><option value="admin">관리자</option></select></div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />활성 계정</label>
      <div><Label htmlFor={`reason-${profile.id}`}>변경 사유</Label><Input id={`reason-${profile.id}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="3자 이상 입력" /></div>
      <Button disabled={pending || reason.trim().length < 3} onClick={() => startTransition(async () => { const result = await setUserAdminRole({ targetId: profile.id, newRole: role, active, reason }); setMessage(result.ok ? "권한을 변경하고 감사 기록을 남겼습니다." : result.message); if (result.ok) { setReason(""); router.refresh(); } })}>{pending ? "변경 중..." : "권한 변경"}</Button>
    </div>}
    {message ? <p className="mt-3 text-sm font-semibold" role="status">{message}</p> : null}
  </article>;
}
