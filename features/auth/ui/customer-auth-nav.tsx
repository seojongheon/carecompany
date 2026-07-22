"use client";

import Link from "next/link";
import { useOptionalAuth } from "../repository/auth-provider";

export function CustomerAuthNav({ mobile = false }: { mobile?: boolean }) {
  const session = useOptionalAuth()?.session ?? null;
  const className = mobile ? "flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" : "nav-link";
  return <Link className={className} href={session?.role === "customer" ? "/account" : "/login"}>{session?.role === "customer" ? "내 계정" : "로그인"}</Link>;
}
