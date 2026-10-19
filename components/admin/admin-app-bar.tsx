"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { adminMenuForRole,currentAdminItem } from "@/lib/admin/navigation";
import { useAuth } from "@/features/auth/repository/auth-provider";
import type { AuthRole } from "@/features/auth/model/types";
import type { ReactNode } from "react";

export function AdminAppBar({role="admin",email,notifications}:{role?:AuthRole;email?:string;notifications?:ReactNode}) {
 const pathname=usePathname()??"/admin";const {signOut}=useAuth();
 return <header className="sticky top-0 z-40 border-b border-[var(--neutral-200)] bg-white/95 backdrop-blur lg:ml-64"><div className="flex min-h-18 flex-wrap items-center justify-between gap-2 px-4 py-2 lg:px-10"><div className="flex items-center gap-3"><div className="lg:hidden"><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="관리자 메뉴 열기"><Menu/></Button></SheetTrigger><SheetContent><SheetTitle>운영 관리</SheetTitle><nav className="mt-8 grid gap-1">{adminMenuForRole(role).map(({href,label})=><Link key={href} className="admin-mobile-link" href={href}>{label}</Link>)}<Link className="admin-mobile-link" href="/">고객 화면 보기</Link></nav></SheetContent></Sheet></div><nav aria-label="현재 위치" className="text-sm"><Link href="/admin" className="text-[var(--neutral-500)]">운영 관리</Link><span aria-hidden="true"> / </span><span className="font-bold">{currentAdminItem(pathname)?.label??"상세"}</span></nav></div><div className="flex items-center gap-2">{notifications}<Link href="/account" className="hidden min-h-11 items-center text-sm text-[var(--neutral-500)] sm:flex">{email??"내 계정"}</Link><Button variant="ghost" size="sm" onClick={async()=>{await signOut();window.location.assign("/");}}>로그아웃</Button></div></div></header>;
}
