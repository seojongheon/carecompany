"use client";

import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccessAdmin } from "@/features/auth/model/authorization";
import { useAuth } from "@/features/auth/repository/auth-provider";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  if (pathname === "/admin/login") return children;
  if (canAccessAdmin(session)) return children;
  return <main id="main-content" className="grid min-h-dvh place-items-center bg-[var(--neutral-50)] p-6"><section className="w-full max-w-lg rounded-2xl border border-[var(--neutral-200)] bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-[var(--brand-700)]" size={40} aria-hidden="true" /><h1 className="mt-5 text-2xl font-black">관리자 인증이 필요합니다</h1><p className="mt-3 text-sm leading-6 text-[var(--neutral-600)]">현재 프런트엔드 목업에서는 관리자 세션을 생성하지 않습니다. Supabase 연동 후 권한이 확인된 관리자만 접근할 수 있습니다.</p><Button className="mt-6" asChild><a href="/admin/login">관리자 로그인</a></Button><p className="mt-5 text-xs text-[var(--neutral-500)]">관리자 회원가입은 제공하지 않습니다.</p></section></main>;
}
