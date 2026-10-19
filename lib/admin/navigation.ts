import type { AuthRole } from "@/features/auth/model/types";
export const ADMIN_MENU = [
 {href:"/admin",label:"대시보드",description:"운영 현황"},
 {href:"/admin/inquiries",label:"문의·상담",description:"접수와 상담 처리"},
 {href:"/admin/portfolio",label:"시공 사례",description:"사례 작성과 게시"},
 {href:"/admin/services",label:"서비스·가격",description:"서비스 안내와 가격표"},
 {href:"/admin/site",label:"사이트 콘텐츠",description:"홈·소개·공지·FAQ"},
 {href:"/admin/media",label:"미디어",description:"이미지와 사용 위치"},
 {href:"/admin/users",label:"회원·권한",description:"회원과 운영자",master:true},
 {href:"/admin/analytics",label:"방문 통계",description:"동의 기반 방문 현황"},
 {href:"/admin/settings",label:"운영 설정",description:"기본 정보·알림·활동 기록",master:true},
] as const;
export function adminMenuForRole(role: AuthRole) { return role === "customer" ? [] : ADMIN_MENU.filter(item => !("master" in item) || role === "super_admin"); }
export function currentAdminItem(pathname: string) { return [...ADMIN_MENU].reverse().find(item=>item.href==="/admin" ? pathname==="/admin" : pathname===item.href || pathname.startsWith(`${item.href}/`)); }
