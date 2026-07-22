"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/repository/auth-provider";

export default function AccountPage() {
  const { session, signOut } = useAuth();
  return <main id="main-content" className="page-shell min-h-[60dvh] py-12"><section className="mx-auto max-w-2xl rounded-2xl border border-[var(--neutral-200)] bg-white p-6 sm:p-8"><p className="text-sm font-black text-[var(--brand-700)]">고객 계정</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">내 계정</h1>{session ? <div className="mt-8 grid gap-5"><div className="rounded-xl bg-[var(--neutral-50)] p-4"><span className="text-sm text-[var(--neutral-500)]">로그인 이메일</span><p className="mt-1 font-bold">{session.email}</p></div><Button className="w-fit" variant="secondary" onClick={signOut}>로그아웃</Button></div> : <div className="mt-8"><p className="text-[var(--neutral-600)]">로그인 후 고객 계정 정보를 확인할 수 있습니다.</p><Button className="mt-5" asChild><Link href="/login">로그인</Link></Button></div>}</section></main>;
}
