"use client";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { servicePath } from "@/lib/routes";
import { useSiteContent } from "@/features/site-content/repository/site-content-provider";

import { ContentState } from "@/features/site-content/ui/content-state";
import { getDocumentDefaults, type FaqDocument } from "@/features/site-content/model/documents";

export function PricingSections() {
  const { snapshot,loading,error } = useSiteContent(); if(loading||error)return <ContentState/>; const content = snapshot.published; const faq = content.faq??(getDocumentDefaults("faq") as FaqDocument).items;
  return <main id="main-content"><section className="border-b border-[var(--neutral-200)] bg-[var(--brand-50)]"><div className="page-shell py-16"><span className="eyebrow">PRICING GUIDE</span><h1 className="page-title">가격 안내</h1><p className="page-lead max-w-2xl">{content.pricingLead}</p></div></section><section className="section-space"><div className="page-shell"><div className="grid gap-5 md:grid-cols-2">{content.priceItems.filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => { const service = (content.services??SEED_SNAPSHOT.services).find((value) => value.key === item.serviceKey); return <article className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6" key={item.id}><p className="text-sm font-black text-[var(--brand-700)]">{item.priceLabel}</p><p>{item.unit}{item.minPrice!==undefined&&item.minPrice!==null?` · ${item.minPrice.toLocaleString()}원${item.maxPrice!=null?` ~ ${item.maxPrice.toLocaleString()}원`:"부터"}`:""}</p><h2 className="mt-2 text-2xl font-black">{item.name}</h2><p className="mt-3 text-[var(--neutral-600)]">{service?.summary}</p><h3 className="mt-6 font-bold">금액이 달라지는 조건</h3><ul className="mt-3 grid gap-2">{item.conditions.map((condition) => <li className="flex gap-2 text-sm" key={condition}><Check aria-hidden="true" size={18} className="mt-0.5 text-[var(--brand-600)]" />{condition}</li>)}</ul>{[ ["포함 사항",item.inclusions],["제외 사항",item.exclusions] ].map(([label,entries])=>Array.isArray(entries)&&entries.length>0?<div key={String(label)} className="mt-4"><h3 className="font-bold">{label}</h3><ul className="list-inside list-disc text-sm">{entries.map(entry=><li key={entry}>{entry}</li>)}</ul></div>:null)}{service ? <Button asChild variant="secondary" className="mt-6"><Link href={servicePath(service.key)}>서비스 사례 보기</Link></Button> : null}</article>; })}</div></div></section><section className="section-space bg-[var(--neutral-50)]"><div className="page-shell max-w-3xl"><h2 className="text-3xl font-black">가격 관련 자주 묻는 질문</h2><Accordion type="single" collapsible className="mt-6">{faq.filter(item=>item.visible&&item.category==="pricing").sort((a,b)=>a.sortOrder-b.sortOrder).map(item=><AccordionItem value={item.id} key={item.id}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion></div></section></main>;
}
