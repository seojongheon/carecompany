"use client";

import Link from "next/link";
import { useOptionalAuth } from "../repository/auth-provider";

export function CustomerAuthNav({ mobile = false }: { mobile?: boolean }) {
  const session = useOptionalAuth()?.session ?? null;
  const className = mobile ? "flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" : "nav-link";

  if (session?.role === "customer") {
    return <button type="button" className={`${className} cursor-not-allowed opacity-50`} disabled aria-label="대시보드 - 고객 대시보드 준비 중">대시보드</button>;
  }

  if (session?.role === "admin" || session?.role === "super_admin") {
    return <Link className={className} href="/admin">대시보드</Link>;
  }

  return <Link className={className} href="/login">로그인</Link>;
}
