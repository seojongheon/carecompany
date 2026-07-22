"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { withPortfolioQuery } from "@/lib/routes";
import { SERVICE_KEYS } from "../model/schemas";
import type { ServiceKey } from "../model/types";
import { PortfolioGrid } from "./portfolio-grid";

export function PortfolioBrowser({ serviceKey, initialLimit = 9 }: { serviceKey?: ServiceKey; initialLimit?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service");
  const service = serviceKey ?? (SERVICE_KEYS.includes(requestedService as ServiceKey) ? requestedService as ServiceKey : "");
  const tag = searchParams.get("tags")?.split(",").filter(Boolean)[0] ?? "";
  const change = (nextService: ServiceKey | "", nextTag: string) => {
    const url = withPortfolioQuery(pathname, {
      service: serviceKey ? undefined : nextService || undefined,
      tags: nextTag ? [nextTag] : undefined,
    }) as Route;
    router.replace(url, { scroll: false });
  };
  return <PortfolioGrid initialLimit={initialLimit} serviceKey={serviceKey} showFilters controlledFilters filterService={service} filterTag={tag} onFiltersChange={change} />;
}
