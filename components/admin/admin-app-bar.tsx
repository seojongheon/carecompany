"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { currentAdminItem } from "@/lib/admin/navigation";
import { useAuth } from "@/features/auth/repository/auth-provider";
import type { AuthRole } from "@/features/auth/model/types";
import { AdminNavigation } from "./admin-sidebar";

export function AdminAppBar({role="admin",email,notifications}:{role?:AuthRole;email?:string;notifications?:ReactNode}) {
  const pathname=usePathname()??"/admin";
  const {signOut}=useAuth();
  const [menuOpen,setMenuOpen]=useState(false);
  return <header className="admin-app-bar"><div className="flex min-w-0 items-center gap-3"><div className="lg:hidden"><Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="관리자 메뉴 열기"><Menu/></Button></SheetTrigger><SheetContent side="left" aria-describedby={undefined} className="admin-mobile-menu"><SheetTitle className="mb-6 text-xl font-bold">위생의 기술 <span className="block text-sm font-normal text-[var(--neutral-500)]">운영 관리</span></SheetTitle><AdminNavigation role={role} onNavigate={()=>setMenuOpen(false)}/></SheetContent></Sheet></div><Link href="/admin" className="text-lg font-bold lg:hidden">위생의 기술</Link><nav aria-label="현재 위치" className="hidden items-center gap-3 text-sm lg:flex"><Link href="/admin" className="text-[var(--neutral-500)]">관리자</Link><span aria-hidden="true" className="text-[var(--neutral-400)]">/</span><span>{currentAdminItem(pathname)?.label??"상세"}</span></nav></div><div className="flex shrink-0 items-center gap-2">{notifications}<DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="ghost" className="px-2 sm:px-3" aria-label="내 계정 메뉴"><UserRound size={18} aria-hidden="true"/><span className="hidden sm:inline">{role==="super_admin"?"최고 관리자":"관리자"}</span><ChevronDown size={14} aria-hidden="true"/></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-56 max-w-[calc(100vw-32px)] rounded-2xl border border-[var(--neutral-200)] bg-white p-2 shadow-lg"><DropdownMenu.Label className="max-w-72 break-all px-3 py-2 text-xs text-[var(--neutral-500)]">{email??"운영 계정"}</DropdownMenu.Label><DropdownMenu.Item asChild><Link href="/account" className="admin-account-item">내 계정</Link></DropdownMenu.Item><DropdownMenu.Separator className="my-1 h-px bg-[var(--neutral-200)]"/><DropdownMenu.Item className="admin-account-item" onSelect={async()=>{await signOut();window.location.assign("/");}}><LogOut size={16} aria-hidden="true"/>로그아웃</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></header>;
}
