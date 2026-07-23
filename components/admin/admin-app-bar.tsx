"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AdminAppBar() {
  return <header className="sticky top-0 z-40 border-b border-[var(--neutral-200)] bg-white lg:hidden"><div className="flex h-16 items-center justify-between px-4"><Link href="/admin" className="font-black">위생의 기술 · 관리자</Link><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="관리자 메뉴 열기"><Menu /></Button></SheetTrigger><SheetContent><SheetTitle className="text-xl font-black">관리자 메뉴</SheetTitle><nav className="mt-8 grid gap-2"><Link className="admin-mobile-link" href="/admin">대시보드</Link><a className="admin-mobile-link" href="/admin/site">홈페이지 관리</a><Link className="admin-mobile-link" href="/admin/portfolio">사례 관리</Link><Link className="admin-mobile-link" href="/admin/users">관리자 권한</Link><Link className="admin-mobile-link" href="/">고객 화면 보기</Link></nav></SheetContent></Sheet></div></header>;
}
