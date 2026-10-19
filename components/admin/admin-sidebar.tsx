"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { adminMenuForRole } from "@/lib/admin/navigation";
import type { AuthRole } from "@/features/auth/model/types";

export function AdminSidebar({role="admin"}:{role?:AuthRole}) {
 const pathname=usePathname()??"/admin";
 return <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-[var(--neutral-900)] p-5 text-white lg:flex"><Link href="/admin" className="flex min-h-12 items-center gap-3 text-lg font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-600)]">위</span>운영 관리</Link><nav aria-label="관리자 메뉴" className="mt-8 grid gap-1 overflow-y-auto">{adminMenuForRole(role).map(({href,label},index)=>{const active=href==="/admin"?pathname===href:pathname.startsWith(href);return <Link aria-current={active?"page":undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold ${active?"bg-white/15 text-white":"text-white/70 hover:bg-white/10 hover:text-white"}`} href={href} key={href}><span aria-hidden="true" className="w-5 text-xs text-white/40">{String(index+1).padStart(2,"0")}</span>{label}</Link>;})}</nav><Link href="/" className="mt-auto flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white/70"><ExternalLink aria-hidden="true" size={17}/>고객 화면 보기</Link></aside>;
}
