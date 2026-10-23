"use client";
import Link from "next/link";
import type { Route } from "next";
import { ContentImage } from "@/features/site-content/ui/content-image";
import { useSiteContent } from "@/features/site-content/repository/site-content-provider";
import { ChevronDown } from "lucide-react";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { servicePath } from "@/lib/routes";
import { MobileMenu } from "./mobile-menu";
import { CustomerAuthNav } from "@/features/auth/ui/customer-auth-nav";

export function Header() {
  const {snapshot,error,loading}=useSiteContent(); const settings=snapshot.published.settings; const services=(snapshot.published.services??SEED_SNAPSHOT.services).filter(service=>service.active).sort((a,b)=>a.sortOrder-b.sortOrder); const businessName=error||loading?"홈":settings.businessName;
  return <header className="sticky top-0 z-40 border-b border-[var(--neutral-200)] bg-white/95 backdrop-blur"><div className="page-shell flex h-18 items-center justify-between"><Link href="/" className="flex min-h-11 items-center gap-2 font-black tracking-[-0.04em]" aria-label={`${businessName} 홈`}>{settings.logo?.path&&!error&&!loading?<ContentImage image={settings.logo} className="h-9 w-9 shrink-0"/>:<span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-600)] text-white">{businessName[0]}</span>}<span>{businessName}</span></Link><nav aria-label="주요 메뉴" className="hidden items-center gap-1 lg:flex"><div className="group relative"><button className="flex min-h-11 items-center gap-1 rounded-xl px-4 font-semibold hover:bg-[var(--neutral-100)]">청소 서비스 <ChevronDown aria-hidden="true" size={16} /></button><div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-xl border border-[var(--neutral-200)] bg-white p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">{services.map((service) => <Link className="flex min-h-11 items-center rounded-lg px-3 hover:bg-[var(--neutral-100)]" href={servicePath(service.key)} key={service.key}>{service.name}</Link>)}</div></div><Link className="nav-link" href="/portfolio">전체 사례</Link><Link className="nav-link" href="/pricing">가격 안내</Link><Link className="nav-link" href="/process">작업 과정</Link><Link className="nav-link" href="/about">업체 소개</Link>{!error&&!loading&&settings.headerCtaHref&&<Link className="nav-link text-[var(--brand-600)]" href={settings.headerCtaHref as Route}>{settings.headerCtaLabel}</Link>}<CustomerAuthNav /></nav><MobileMenu /></div></header>;
}
