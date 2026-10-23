"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, ExternalLink, FileText, House, Images, MessageSquare, Settings, Tags, Users } from "lucide-react";
import { adminMenuForRole } from "@/lib/admin/navigation";
import type { AuthRole } from "@/features/auth/model/types";

const icons = {"/admin":House,"/admin/inquiries":MessageSquare,"/admin/portfolio":BriefcaseBusiness,"/admin/services":Tags,"/admin/site":FileText,"/admin/media":Images,"/admin/users":Users,"/admin/analytics":BarChart3,"/admin/settings":Settings};
const groups = [{label:"개요",paths:["/admin"]},{label:"업무",paths:["/admin/inquiries","/admin/portfolio"]},{label:"콘텐츠",paths:["/admin/services","/admin/site","/admin/media"]},{label:"관리",paths:["/admin/users","/admin/analytics","/admin/settings"]}];

export function AdminNavigation({role,onNavigate}:{role:AuthRole;onNavigate?:()=>void}) {
  const pathname=usePathname()??"/admin";
  const menu=adminMenuForRole(role);
  return <nav aria-label="관리자 메뉴" className="admin-navigation">{groups.map(group=>{
    const items=menu.filter(item=>group.paths.includes(item.href));
    if(!items.length)return null;
    return <div key={group.label} className="admin-nav-group"><p>{group.label}</p>{items.map(({href,label})=>{
      const active=href==="/admin"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);
      const Icon=icons[href];
      return <Link key={href} href={href} onClick={onNavigate} aria-current={active?"page":undefined} className="admin-nav-item"><Icon size={18} aria-hidden="true"/>{label}</Link>;
    })}</div>;
  })}<Link href="/" onClick={onNavigate} className="admin-customer-link"><ExternalLink size={17} aria-hidden="true"/>고객 화면 보기</Link></nav>;
}
export function AdminSidebar({role="admin"}:{role?:AuthRole}) {
  return <aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><span className="admin-brand-symbol" aria-hidden="true">위</span><span><strong>위생의 기술</strong><small>운영 관리</small></span></Link><AdminNavigation role={role}/><p className="admin-role-label">{role==="super_admin"?"최고 관리자":"관리자"} 작업 공간</p></aside>;
}
