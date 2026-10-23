"use client";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useSiteContent } from "@/features/site-content/repository/site-content-provider";
import { ContentState } from "@/features/site-content/ui/content-state";
import { ContentImage } from "@/features/site-content/ui/content-image";

export function ProcessSections() {
 const {snapshot,loading,error}=useSiteContent();if(loading||error)return <ContentState/>;const steps=snapshot.published.processSteps.filter(step=>step.visible).sort((a,b)=>a.sortOrder-b.sortOrder);
  return <main id="main-content"><section className="border-b border-[var(--neutral-200)]"><div className="page-shell py-16"><span className="eyebrow">HOW WE WORK</span><h1 className="page-title">{snapshot.published.process?.title??"확인부터 마무리까지"}</h1><p className="page-lead max-w-2xl">{snapshot.published.process?.description??"현장마다 범위를 확인하고 안전하게 작업합니다."}</p></div></section><section className="section-space"><div className="page-shell"><ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{steps.map(({id,title,description,image}, index) => <li data-testid="process-step" className="relative rounded-2xl border border-[var(--neutral-200)] p-6" key={id}><span className="absolute right-5 top-4 text-5xl font-black text-[var(--neutral-100)]">{String(index + 1).padStart(2, "0")}</span><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><ClipboardList aria-hidden="true" /></span><ContentImage image={image}/><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-[var(--neutral-600)]">{description}</p></li>)}</ol></div></section><section className="section-space bg-[var(--neutral-50)]"><div className="page-shell"><h2 className="text-3xl font-black">서비스별로 달라지는 점</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><article className="rounded-2xl bg-white p-6"><h3 className="text-xl font-bold">화장실·에어컨</h3><p className="mt-2 text-[var(--neutral-600)]">화장실은 표면 재질과 틈새 오염, 에어컨은 기기 형태와 분해 가능한 범위가 작업 방법을 좌우합니다.</p></article><article className="rounded-2xl bg-white p-6"><h3 className="text-xl font-bold">아파트·상가 유리창</h3><p className="mt-2 text-[var(--neutral-600)]">창 구조와 높이, 외부 접근 안전성, 거주·영업 동선을 확인해 가능한 범위를 정합니다.</p></article></div><Button asChild className="mt-8"><Link href="/portfolio">실제 작업 사례 보기</Link></Button></div></section></main>;
}

