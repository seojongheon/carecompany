"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { Service } from "@/features/portfolio/model/types";
import { servicePath } from "@/lib/routes";

import { useSiteContent } from "@/features/site-content/repository/site-content-provider";

export function ServiceCard({ service }: { service: Service }) {
  const {snapshot}=useSiteContent(); const published=snapshot.published.services?.find(item=>item.key===service.key); const value={...service,...published}; const image=published?.image as (import("@/features/site-content/model/documents").ContentImage & {url?:string})|undefined;
  return <Link href={servicePath(value.key)} className="group overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden"><Image className="object-cover transition duration-500 group-hover:scale-105" src={image?.url??MOCK_ASSETS[value.coverAssetKey]??MOCK_ASSETS[service.coverAssetKey]} alt={image?.alt??""} unoptimized={!!image?.url} style={image?{objectPosition:`${image.focalX}% ${image.focalY}%`}:undefined} fill sizes="(max-width: 768px) 50vw, 25vw" /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{value.name}</h3><ArrowUpRight aria-hidden="true" className="shrink-0 text-[var(--brand-600)]" /></div><p className="mt-2 text-sm text-[var(--neutral-500)]">{value.summary}</p></div></Link>;
}

