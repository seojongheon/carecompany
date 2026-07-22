"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";

import { MOCK_ASSETS } from "../data/seed";
import type { PortfolioCardView } from "../model/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { portfolioPath } from "@/lib/routes";

export function QuickView({ items, initialSlug, onClose, onNavigate }: { items: PortfolioCardView[]; initialSlug: string; onClose(): void; onNavigate?: (slug: string) => void }) {
  const initialIndex = Math.max(0, items.findIndex(({ slug }) => slug === initialSlug));
  const [index, setIndex] = useState(initialIndex);
  const item = items[index];
  const move = (next: number) => { setIndex(next); onNavigate?.(items[next].slug); };
  if (!item) return null;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="w-[min(96vw,980px)] p-0 md:grid md:grid-cols-[1.15fr_.85fr]" aria-describedby={undefined}><div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-[var(--neutral-100)] md:aspect-auto md:min-h-[620px] md:rounded-l-2xl md:rounded-tr-none"><Image src={MOCK_ASSETS[item.coverMedia.mockAssetKey]} alt={item.coverMedia.altText} fill loading="eager" className="object-cover" sizes="(max-width: 768px) 96vw, 60vw" /></div><div className="flex flex-col p-6 md:p-8"><p className="text-sm font-black text-[var(--brand-700)]">{item.service.name}</p><DialogTitle className="mt-3 pr-8 text-3xl leading-tight tracking-[-0.04em]">{item.title}</DialogTitle><DialogDescription className="mt-4 text-[var(--neutral-600)]">{item.summary}</DialogDescription><dl className="mt-6 grid gap-3 text-sm"><div><dt className="font-bold">지역</dt><dd>{item.locationDisplay}</dd></div><div><dt className="font-bold">작업 시기</dt><dd>{item.displayPeriod}</dd></div></dl><Button asChild className="mt-8"><Link href={portfolioPath(item.slug)}>상세 사례 보기 <ExternalLink aria-hidden="true" size={17} /></Link></Button><div className="mt-auto flex items-center justify-between pt-8"><Button variant="secondary" size="icon" aria-label="이전 사례" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft aria-hidden="true" /></Button><span className="font-bold">{index + 1} / {items.length}</span><Button variant="secondary" size="icon" aria-label="다음 사례" disabled={index === items.length - 1} onClick={() => move(index + 1)}><ChevronRight aria-hidden="true" /></Button></div></div></DialogContent></Dialog>;
}
