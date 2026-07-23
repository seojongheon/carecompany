"use client";

import { useState } from "react";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { CaseMedia } from "@/features/portfolio/model/types";
import { CaseLightbox } from "./case-lightbox";
import { MediaFallback } from "./media-fallback";
import { useCaseMediaUrls } from "@/features/portfolio/storage/use-case-media-urls";

export function GalleryGrid({ media, eagerFirst = false }: { media: CaseMedia[]; eagerFirst?: boolean }) {
  const [active, setActive] = useState(-1);
  const urls = useCaseMediaUrls(media);
  return <><div className={media.length === 1 ? "grid" : "grid gap-4 sm:grid-cols-2"}>{media.map((item, index) => <button key={item.id} onClick={() => setActive(index)} className="group text-left"><span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--neutral-100)]"><MediaFallback src={urls[item.id] ?? MOCK_ASSETS[item.mockAssetKey]} alt={item.altText} eager={eagerFirst && index === 0} sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" /></span>{item.caption ? <span className="mt-2 block text-sm text-[var(--neutral-600)]">{item.caption}</span> : null}</button>)}</div>{active >= 0 ? <CaseLightbox media={media} index={active} onClose={() => setActive(-1)} urls={urls} /> : null}</>;
}
