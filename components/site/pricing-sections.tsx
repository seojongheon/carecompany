"use client";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { servicePath } from "@/lib/routes";
import { useSiteContent } from "@/features/site-content/repository/site-content-provider";

export function PricingSections() {
  const { snapshot } = useSiteContent(); const content = snapshot.published;
  return <main id="main-content"><section className="border-b border-[var(--neutral-200)] bg-[var(--brand-50)]"><div className="page-shell py-16"><span className="eyebrow">PRICING GUIDE</span><h1 className="page-title">가격 안내</h1><p className="page-lead max-w-2xl">{content.pricingLead}</p></div></section><section className="section-space"><div className="page-shell"><div className="grid gap-5 md:grid-cols-2">{content.priceItems.filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => { const service = SEED_SNAPSHOT.services.find((value) => value.key === item.serviceKey); return <article className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6" key={item.id}><p className="text-sm font-black text-[var(--brand-700)]">{item.priceLabel}</p><h2 className="mt-2 text-2xl font-black">{item.name}</h2><p className="mt-3 text-[var(--neutral-600)]">{service?.summary}</p><h3 className="mt-6 font-bold">금액이 달라지는 조건</h3><ul className="mt-3 grid gap-2">{item.conditions.map((condition) => <li className="flex gap-2 text-sm" key={condition}><Check aria-hidden="true" size={18} className="mt-0.5 text-[var(--brand-600)]" />{condition}</li>)}</ul>{service ? <Button asChild variant="secondary" className="mt-6"><Link href={servicePath(service.key)}>서비스 사례 보기</Link></Button> : null}</article>; })}</div></div></section><section className="section-space bg-[var(--neutral-50)]"><div className="page-shell max-w-3xl"><h2 className="text-3xl font-black">가격 관련 자주 묻는 질문</h2><Accordion type="single" collapsible className="mt-6"><AccordionItem value="photo"><AccordionTrigger>사진만으로 정확한 금액을 알 수 있나요?</AccordionTrigger><AccordionContent>사진은 범위를 파악하는 데 도움이 되지만, 현장 상태와 작업 가능 범위를 함께 확인해야 최종 안내가 가능합니다.</AccordionContent></AccordionItem><AccordionItem value="case-price"><AccordionTrigger>사례의 작업 가격은 왜 없나요?</AccordionTrigger><AccordionContent>당시 조건이 다른 가격을 현재 현장에 그대로 적용하는 오해를 막기 위해 개별 사례 가격을 공개하지 않습니다.</AccordionContent></AccordionItem></Accordion></div></section></main>;
}
