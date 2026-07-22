import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BeforeAfter } from "@/components/portfolio/before-after";
import { CaseMetadata } from "@/components/portfolio/case-metadata";
import { GalleryGrid } from "@/components/portfolio/gallery-grid";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { YouTubeLazy } from "@/components/portfolio/youtube-lazy";
import { Button } from "@/components/ui/button";
import { servicePath } from "@/lib/routes";
import type { MediaStage, PortfolioCardView, PublicCaseDetail } from "../model/types";

const stageLabels: Record<MediaStage, string> = { before: "작업 전", process: "작업 과정", after: "작업 후", detail: "세부" };

export function CaseDetail({ detail, related }: { detail: PublicCaseDetail; related: PortfolioCardView[] }) {
  const grouped = Object.entries(stageLabels).map(([stage, label]) => ({ stage: stage as MediaStage, label, media: detail.media.filter((item) => item.stage === stage) }));
  const before = grouped.find(({ stage }) => stage === "before")!.media;
  const after = grouped.find(({ stage }) => stage === "after")!.media;
  const middle = grouped.filter(({ stage }) => stage === "process" || stage === "detail");
  return <main id="main-content"><article><header className="border-b border-[var(--neutral-200)]"><div className="page-shell py-12"><Link href="/portfolio" className="inline-flex min-h-11 items-center gap-2 font-bold text-[var(--brand-700)]"><ArrowLeft aria-hidden="true" size={18} />전체 사례</Link><p className="mt-6 text-sm font-black text-[var(--brand-700)]">{detail.service.name}</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">{detail.title}</h1><p className="mt-5 max-w-3xl text-lg text-[var(--neutral-600)]">{detail.summary}</p><div className="mt-6"><CaseMetadata detail={detail} /></div></div></header><div className="page-shell py-12"><BeforeAfter before={before} after={after} /><section className="mt-16 grid gap-5 lg:grid-cols-3">{[["작업 전 상태",detail.problemDescription],["진행한 작업",detail.workDescription],["작업 결과",detail.resultDescription]].map(([title, copy]) => <div className="rounded-2xl bg-[var(--neutral-50)] p-6" key={title}><h2 className="text-lg font-bold">{title}</h2><p className="mt-3 text-[var(--neutral-600)]">{copy}</p></div>)}</section>{middle.map((group) => group.media.length ? <section className="mt-16" key={group.stage}><h2 className="mb-6 text-3xl font-black">{group.label}</h2><GalleryGrid media={group.media} /></section> : null)}{detail.videos.length ? <section className="mt-16"><h2 className="mb-6 text-3xl font-black">작업 영상</h2><div className="grid gap-5 lg:grid-cols-2">{detail.videos.map((video) => <YouTubeLazy video={video} key={video.id} />)}</div></section> : null}<div className="mt-16 flex flex-wrap gap-3 rounded-2xl bg-[var(--brand-50)] p-7"><Button asChild><Link href={servicePath(detail.service.key)}>{detail.service.name} 더 보기 <ArrowRight aria-hidden="true" size={18} /></Link></Button><Button asChild variant="secondary"><Link href="/pricing">가격 안내</Link></Button></div></div></article>{related.length ? <section className="section-space bg-[var(--neutral-50)]"><div className="page-shell"><h2 className="mb-8 text-3xl font-black">관련 작업 사례</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <PortfolioCard item={item} key={item.id} />)}</div></div></section> : null}</main>;
}

