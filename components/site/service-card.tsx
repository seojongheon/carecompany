import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { Service } from "@/features/portfolio/model/types";
import { servicePath } from "@/lib/routes";

export function ServiceCard({ service }: { service: Service }) {
  return <Link href={servicePath(service.key)} className="group overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden"><Image className="object-cover transition duration-500 group-hover:scale-105" src={MOCK_ASSETS[service.coverAssetKey]} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{service.name}</h3><ArrowUpRight aria-hidden="true" className="shrink-0 text-[var(--brand-600)]" /></div><p className="mt-2 text-sm text-[var(--neutral-500)]">{service.summary}</p></div></Link>;
}

