import { Suspense } from "react";
import type { Service } from "../model/types";
import { PortfolioBrowser } from "./portfolio-browser";
import { StickySectionTabs } from "@/components/site/sticky-section-tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function ServicePage({ service }: { service: Service }) {
  return <main id="main-content"><section className="border-b border-[var(--neutral-200)] bg-[var(--brand-50)]"><div className="page-shell py-16"><span className="eyebrow">{service.name}</span><h1 className="page-title mt-4">{service.name}</h1><p className="page-lead max-w-2xl">{service.description}</p></div></section><StickySectionTabs items={[{ href: "#cases", label: "작업 사례" }, { href: "#scope", label: "서비스 안내" }, { href: "/process", label: "작업 과정" }, { href: "/pricing", label: "가격 안내" }]} /><section id="cases" className="section-space scroll-mt-32"><div className="page-shell"><div className="section-heading"><div><h2>{service.name} 사례</h2><p>공개 검토를 마친 현장만 표시합니다.</p></div></div><Suspense fallback={<Skeleton className="h-96 w-full" />}><PortfolioBrowser serviceKey={service.key} initialLimit={6} /></Suspense></div></section><section id="scope" className="section-space bg-[var(--neutral-50)]"><div className="page-shell grid gap-8 lg:grid-cols-2"><div><span className="eyebrow">SCOPE</span><h2 className="mt-3 text-3xl font-black">현장마다 범위가 다릅니다</h2></div><div className="rounded-2xl bg-white p-7"><p>{service.summary}</p><p className="mt-4 text-[var(--neutral-500)]">오염 정도와 재질, 작업 가능 범위를 확인한 뒤 필요한 부분과 제외 범위를 안내합니다. 개별 사례의 과거 가격은 표시하지 않습니다.</p></div></div></section></main>;
}
