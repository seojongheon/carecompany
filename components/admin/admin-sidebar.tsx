import Link from "next/link";
import { ExternalLink, LayoutDashboard, PlusCircle, Rows3, Settings2, Users } from "lucide-react";

export function AdminSidebar() {
  const links = [["/admin","대시보드",LayoutDashboard],["/admin/site","홈페이지 관리",Settings2],["/admin/portfolio","사례 관리",Rows3],["/admin/portfolio/new","새 사례",PlusCircle],["/admin/users","관리자 권한",Users]] as const;
  return <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--neutral-200)] bg-[var(--neutral-900)] p-5 text-white lg:block"><Link href="/admin" className="flex min-h-12 items-center gap-3 text-lg font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-600)]">위</span>관리자</Link><nav aria-label="관리자 메뉴" className="mt-10 grid gap-2">{links.map(([href,label,Glyph]) => <a className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-white/75 hover:bg-white/10 hover:text-white" href={href} key={href}><Glyph aria-hidden="true" size={20} />{label}</a>)}</nav><Link href="/" className="absolute bottom-6 left-5 right-5 flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white/70"><ExternalLink aria-hidden="true" size={17} />고객 화면 보기</Link></aside>;
}
