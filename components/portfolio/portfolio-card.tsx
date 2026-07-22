"use client";

import Link from "next/link";
import type { Route } from "next";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { PortfolioCardView } from "@/features/portfolio/model/types";
import { portfolioPath, withPortfolioQuery } from "@/lib/routes";
import { MediaFallback } from "./media-fallback";

export function PortfolioCard({ item, contextQuery, eager = false }: { item: PortfolioCardView; contextQuery?: Record<string, string | undefined>; eager?: boolean }) {
  const href = withPortfolioQuery(portfolioPath(item.slug), contextQuery ?? {}) as Route;
  return <article data-testid="portfolio-card" className="group overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white"><Link href={href} data-portfolio-slug={item.slug} onClick={() => sessionStorage.setItem("portfolio:return-focus", item.slug)} className="block"><div className="relative aspect-[4/3] overflow-hidden bg-[var(--neutral-100)]"><MediaFallback src={MOCK_ASSETS[item.coverMedia.mockAssetKey]} alt={item.coverMedia.altText} eager={eager} className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /><span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold backdrop-blur">{item.service.name}</span></div><div className="p-5"><h3 className="line-clamp-2 text-lg font-bold tracking-[-0.02em]">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm text-[var(--neutral-500)]">{item.summary}</p><div className="mt-4 flex items-center justify-between text-sm"><span>{item.locationDisplay} · {item.displayPeriod}</span><span className="font-semibold text-[var(--brand-700)]">사진 {item.publicMediaCount}장</span></div></div></Link></article>;
}
