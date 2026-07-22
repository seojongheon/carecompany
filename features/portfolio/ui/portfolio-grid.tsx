"use client";

import { useEffect, useMemo, useState } from "react";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { StatusState } from "@/components/site/status-state";
import { Button } from "@/components/ui/button";
import type { ServiceKey } from "../model/types";
import { usePortfolio } from "../repository/use-portfolio";
import { selectPublicCases } from "../selectors/portfolio-selectors";

interface PortfolioGridProps {
  initialLimit?: number;
  serviceKey?: ServiceKey;
  showFilters?: boolean;
  controlledFilters?: boolean;
  filterService?: ServiceKey | "";
  filterTag?: string;
  onFiltersChange?: (service: ServiceKey | "", tag: string) => void;
}

export function PortfolioGrid({ initialLimit = 8, serviceKey, showFilters = false, controlledFilters = false, filterService = "", filterTag = "", onFiltersChange }: PortfolioGridProps) {
  const { snapshot } = usePortfolio();
  const [limit, setLimit] = useState(initialLimit);
  const [service, setService] = useState<ServiceKey | "">(serviceKey ?? "");
  const [tag, setTag] = useState("");
  useEffect(() => {
    const restoreFocus = () => window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const slug = sessionStorage.getItem("portfolio:return-focus");
      if (!slug) return;
      document.querySelector<HTMLElement>(`[data-portfolio-slug="${CSS.escape(slug)}"]`)?.focus();
      sessionStorage.removeItem("portfolio:return-focus");
    }));
    window.addEventListener("popstate", restoreFocus);
    return () => window.removeEventListener("popstate", restoreFocus);
  }, []);
  const activeService = controlledFilters ? (serviceKey ?? filterService) : service;
  const activeTag = controlledFilters ? filterTag : tag;
  const page = useMemo(() => selectPublicCases(snapshot, { serviceKey: activeService || undefined, tagKeys: activeTag ? [activeTag] : undefined, limit }), [activeService, activeTag, limit, snapshot]);
  const updateFilters = (nextService: ServiceKey | "", nextTag: string) => {
    if (controlledFilters) onFiltersChange?.(nextService, nextTag);
    else { setService(nextService); setTag(nextTag); }
    setLimit(initialLimit);
  };
  const reset = () => updateFilters(serviceKey ?? "", "");
  const contextQuery = { service: activeService || undefined, tags: activeTag || undefined };
  return <div>{showFilters ? <div className="mb-8 grid gap-3 rounded-2xl bg-[var(--neutral-50)] p-4 sm:grid-cols-2"><label className="font-semibold">서비스 필터<select aria-label="서비스 필터" disabled={Boolean(serviceKey)} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--neutral-200)] bg-white px-3 disabled:bg-[var(--neutral-100)]" value={activeService} onChange={(event) => updateFilters(event.target.value as ServiceKey | "", activeTag)}><option value="">전체 서비스</option>{snapshot.services.map((item) => <option value={item.key} key={item.key}>{item.name}</option>)}</select></label><label className="font-semibold">세부 필터<select aria-label="세부 필터" className="mt-1 min-h-11 w-full rounded-xl border border-[var(--neutral-200)] bg-white px-3" value={activeTag} onChange={(event) => updateFilters(activeService, event.target.value)}><option value="">전체 조건</option><option value="home">주거</option><option value="heavy-soil">묵은 오염</option><option value="full-clean">전체 관리</option><option value="missing-tag">결과 없음 예시</option></select></label></div> : null}{page.items.length ? <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.items.map((item, index) => <PortfolioCard item={item} contextQuery={contextQuery} eager={index === 0} key={item.id} />)}</div>{page.items.length < page.totalPublic ? <div className="mt-8 text-center"><Button variant="secondary" onClick={() => setLimit((current) => current + initialLimit)}>사례 더 보기</Button><p className="mt-2 text-sm text-[var(--neutral-500)]">{page.items.length} / {page.totalPublic}개</p></div> : null}</> : <StatusState kind="empty" title="조건에 맞는 공개 사례가 없습니다" description="다른 서비스나 조건을 선택해 보세요." actionLabel="필터 초기화" onAction={reset} />}</div>;
}
