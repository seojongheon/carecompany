"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { selectPublicCases } from "../selectors/portfolio-selectors";
import { usePortfolio } from "../repository/use-portfolio";
import { portfolioPath, withPortfolioQuery } from "@/lib/routes";
import type { ServiceKey } from "../model/types";
import { QuickView } from "./quick-view";

export function InterceptedQuickView({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot } = usePortfolio();
  const serviceKey = searchParams.get("service") as ServiceKey | null;
  const tagKeys = searchParams.get("tags")?.split(",").filter(Boolean);
  const items = selectPublicCases(snapshot, { serviceKey: serviceKey ?? undefined, tagKeys, limit: 100 }).items;
  const contextQuery = { service: serviceKey ?? undefined, tags: tagKeys };
  if (!items.some((item) => item.slug === slug)) return null;
  return <QuickView items={items} initialSlug={slug} onClose={() => router.back()} onNavigate={(next) => router.replace(withPortfolioQuery(portfolioPath(next), contextQuery) as Route, { scroll: false })} />;
}
