"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusState } from "@/components/site/status-state";
import { MediaFallback } from "@/components/portfolio/media-fallback";
import type { AdminCaseFilter, ServiceKey } from "../model/types";
import { selectAdminCases } from "../selectors/portfolio-selectors";
import { useAdminPortfolio } from "../repository/use-portfolio";
import { useCaseMediaUrls } from "../storage/use-case-media-urls";
import { AdminTagManager } from "./admin-tag-manager";

const subscribe = (listener: () => void) => { window.addEventListener("popstate", listener); return () => window.removeEventListener("popstate", listener); };
const getSearch = () => window.location.search;
export function AdminCaseList() {
  const { snapshot, loading, loadError, reload } = useAdminPortfolio();
  const search = useSyncExternalStore(subscribe, getSearch, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const filter: AdminCaseFilter = { status: (params.get("status") || "all") as AdminCaseFilter["status"], serviceKey: (params.get("service") || undefined) as ServiceKey | undefined, search: params.get("q") || "", dateFrom: params.get("from") || "", dateTo: params.get("to") || "", sort: params.get("sort") === "published" ? "published" : "updated" };
  const items = selectAdminCases(snapshot, filter);
  const pages = Math.max(1, Math.ceil(items.length / 20));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  const pageItems = items.slice((page - 1) * 20, page * 20);
  const mediaUrls = useCaseMediaUrls(pageItems.flatMap(item => item.coverMedia ? [item.coverMedia] : []));
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "page") next.delete("page"); window.history.replaceState(null, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`); window.dispatchEvent(new PopStateEvent("popstate")); };
  return <div className="mt-8">
    <div className="mb-4 flex justify-end"><Button asChild><Link href="/admin/portfolio/new"><Plus aria-hidden="true" size={18} />사례 추가</Link></Button></div>
    <div className="grid gap-3 rounded-2xl border border-[var(--neutral-200)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="font-semibold">제목·지역 검색<Input aria-label="제목·지역 검색" value={filter.search} onChange={e => setFilter("q", e.target.value)} /></label>
      <label className="font-semibold">공개 상태<select aria-label="공개 상태" className="admin-select" value={filter.status} onChange={e => setFilter("status", e.target.value)}><option value="all">전체</option><option value="published">공개</option><option value="private">비공개</option><option value="draft">게시 중 · 변경 초안 있음</option><option value="deleted">휴지통</option></select></label>
      <label className="font-semibold">서비스<select aria-label="관리 서비스" className="admin-select" value={filter.serviceKey || ""} onChange={e => setFilter("service", e.target.value)}><option value="">전체</option>{snapshot.services.map(item => <option value={item.key} key={item.key}>{item.name}</option>)}</select></label>
      <label className="font-semibold">수정일 시작<Input type="date" value={filter.dateFrom} onChange={e => setFilter("from", e.target.value)} /></label>
      <label className="font-semibold">수정일 종료<Input type="date" value={filter.dateTo} onChange={e => setFilter("to", e.target.value)} /></label>
      <label className="font-semibold">정렬<select className="admin-select" value={filter.sort} onChange={e => setFilter("sort", e.target.value)}><option value="updated">최근 수정순</option><option value="published">최근 공개순</option></select></label>
    </div>
    {loadError ? <div role="alert" className="my-5 rounded-xl bg-red-50 p-4">{loadError}<Button variant="secondary" onClick={reload}>다시 시도</Button></div> : loading ? <p role="status" className="my-5">사례를 불러오는 중입니다.</p> : items.length ? <>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white">{pageItems.map(item => <article data-testid="admin-case-row" className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 border-b border-[var(--neutral-200)] p-4 last:border-0 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center" key={item.id}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--neutral-100)]">{item.coverMedia ? <MediaFallback key={item.coverMedia.id} src={mediaUrls[item.coverMedia.id]} alt={item.coverMedia.altText || `${item.title} 대표 사진`} sizes="(min-width: 768px) 112px, 80px" className="h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center p-2 text-center text-xs text-[var(--neutral-500)]">대표 사진 없음</span>}</div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={item.status === "published" ? "status-pill status-public" : item.status === "deleted" ? "status-pill status-deleted" : "status-pill status-private"}>{item.status === "published" ? "공개" : item.status === "deleted" ? "휴지통" : "비공개"}</span>{item.hasDraft ? <span className="status-pill">편집 초안 있음</span> : null}<span className="text-xs font-bold text-[var(--neutral-500)]">{item.service.name}</span></div><h3 className="mt-2 break-words font-bold">{item.title}</h3><p className="mt-1 text-sm text-[var(--neutral-500)]">{item.locationDisplay} · 사진 {item.mediaCount}장</p>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs text-[var(--neutral-500)]"><dt>작업일</dt><dd>{item.workDate ? <time dateTime={item.workDate}>{item.workDate}</time> : "미입력"}</dd><dt>수정일</dt><dd><time dateTime={item.updatedAt}>{item.updatedAt.slice(0, 10)}</time></dd><dt>수정자</dt><dd className="break-all">{item.updatedBy || "기록 없음"}</dd></dl>
        </div>
        <Button asChild size="sm" variant="secondary" className="col-start-2 justify-self-start md:col-start-auto"><Link href={`/admin/portfolio/${item.id}/edit`}><Pencil aria-hidden="true" size={15} />편집</Link></Button>
      </article>)}</div><nav aria-label="사례 페이지" className="my-4 flex items-center justify-between gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))}>이전</Button><span>{page} / {pages} · 총 {items.length}건</span><Button variant="secondary" disabled={page >= pages} onClick={() => setFilter("page", String(page + 1))}>다음</Button></nav>
    </> : <div className="mt-5"><StatusState kind="empty" title="조건에 맞는 사례가 없습니다" description="필터를 바꾸거나 사례를 추가해 보세요." /></div>}
    <AdminTagManager />
  </div>;
}
