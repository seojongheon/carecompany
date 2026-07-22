"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/site/status-state";
import type { CaseStatus, ServiceKey } from "../model/types";
import { selectAdminCases } from "../selectors/portfolio-selectors";
import { usePortfolio } from "../repository/use-portfolio";

export function AdminCaseList() {
  const { snapshot, resetToSeed } = usePortfolio();
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [service, setService] = useState<ServiceKey | "">("");
  const items = useMemo(() => selectAdminCases(snapshot, { status, serviceKey: service || undefined }), [service, snapshot, status]);
  return <div className="mt-8"><div className="grid gap-3 rounded-2xl border border-[var(--neutral-200)] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="font-semibold">공개 상태<select aria-label="공개 상태" className="admin-select" value={status} onChange={(event) => setStatus(event.target.value as CaseStatus | "all")}><option value="all">전체</option><option value="published">공개</option><option value="private">비공개</option><option value="deleted">삭제됨</option></select></label><label className="font-semibold">서비스<select aria-label="관리 서비스" className="admin-select" value={service} onChange={(event) => setService(event.target.value as ServiceKey | "")}><option value="">전체</option>{snapshot.services.map((item) => <option value={item.key} key={item.key}>{item.name}</option>)}</select></label><Button variant="secondary" onClick={resetToSeed}><RotateCcw aria-hidden="true" size={17} />시드 초기화</Button></div>{items.length ? <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white">{items.map((item) => <article data-testid="admin-case-row" className="grid gap-3 border-b border-[var(--neutral-200)] p-4 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center" key={item.id}><div><div className="flex flex-wrap items-center gap-2"><span className={item.status === "published" ? "status-pill status-public" : item.status === "deleted" ? "status-pill status-deleted" : "status-pill status-private"}>{item.status === "published" ? "공개" : item.status === "deleted" ? "삭제됨" : "비공개"}</span><span className="text-xs font-bold text-[var(--neutral-500)]">{item.service.name}</span></div><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-1 text-sm text-[var(--neutral-500)]">{item.locationDisplay} · 사진 {item.mediaCount}장</p></div><time className="text-sm text-[var(--neutral-500)]">{item.updatedAt.slice(0, 10)}</time><Button asChild size="sm" variant="secondary"><Link href={`/admin/portfolio/${item.id}/edit`}><Pencil aria-hidden="true" size={15} />편집</Link></Button></article>)}</div> : <div className="mt-5"><StatusState kind="empty" title="조건에 맞는 사례가 없습니다" description="필터를 바꾸거나 새 사례를 만들어 보세요." /></div>}</div>;
}

