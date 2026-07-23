"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaFallback } from "@/components/portfolio/media-fallback";
import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { MediaStage } from "@/features/portfolio/model/types";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";
import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { useCaseMediaUrls } from "@/features/portfolio/storage/use-case-media-urls";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function PhotoManager({ caseId }: { caseId: string }) {
  const { snapshot, repository, setCaseMedia } = usePortfolio();
  const media = snapshot.media.filter((item) => item.caseId === caseId).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const urls = useCaseMediaUrls(media);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<MediaStage | "all" | "private">("all");
  const visible = media.filter((item) => filter === "all" || filter === "private" ? filter === "all" || !item.public : item.stage === filter);
  const patch = (id: string, changes: Partial<(typeof media)[number]>) => {
    setCaseMedia(caseId, media.map((item) => item.id === id ? { ...item, ...changes } : changes.cover ? { ...item, cover: false } : item));
  };
  const bulk = (changes: Partial<(typeof media)[number]>) => {
    setCaseMedia(caseId, media.map((item) => selected.has(item.id) ? { ...item, ...changes, cover: changes.public === false ? false : item.cover } : item));
  };
  const move = (id: string, direction: -1 | 1) => {
    const current = media.find((item) => item.id === id)!;
    const sameStage = media.filter(({ stage }) => stage === current.stage);
    const index = sameStage.findIndex((item) => item.id === id);
    const neighbor = sameStage[index + direction];
    if (!neighbor) return;
    setCaseMedia(caseId, media.map((item) => item.id === current.id ? { ...item, sortOrder: neighbor.sortOrder } : item.id === neighbor.id ? { ...item, sortOrder: current.sortOrder } : item));
  };
  const removeSelected = () => {
    const removed = media.filter((item) => selected.has(item.id));
    const remaining = media.filter((item) => !selected.has(item.id));
    void (async () => {
      if (repository instanceof SupabasePortfolioRepository && process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true") {
        const client = createBrowserSupabaseClient();
        const originals = removed.flatMap((item) => item.originalStoragePath ? [item.originalStoragePath] : []);
        const reviewed = removed.flatMap((item) => item.storagePath ? [item.storagePath] : []);
        if (originals.length) await client.storage.from("case-originals").remove(originals);
        if (reviewed.length) await client.storage.from("case-reviewed-public").remove(reviewed);
      }
      await setCaseMedia(caseId, remaining);
    })();
    setSelected(new Set());
  };

  return <section className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-black">사진 관리</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">{media.length} / 69장 · 단계 안에서 순서를 조정합니다.</p></div>{selected.size ? <div className="flex flex-wrap items-end gap-2 rounded-xl bg-[var(--brand-50)] p-2"><label className="text-xs font-bold">선택 사진 단계<select aria-label="선택 사진 단계" className="admin-select" defaultValue="detail" onChange={(event) => bulk({ stage: event.target.value as MediaStage })}><option value="before">작업 전</option><option value="process">작업 과정</option><option value="after">작업 후</option><option value="detail">세부</option></select></label><Button size="sm" onClick={() => bulk({ public: true })}>선택 사진 공개</Button><Button size="sm" variant="secondary" onClick={() => bulk({ public: false })}>선택 사진 비공개</Button><Button size="sm" variant="danger" onClick={removeSelected}><Trash2 size={16} />선택 삭제</Button></div> : null}</div><div role="tablist" aria-label="사진 분류" className="mt-4 flex gap-2 overflow-x-auto pb-1">{([['all','전체'],['before','작업 전'],['process','작업 과정'],['after','작업 후'],['detail','세부'],['private','비공개 사진']] as const).map(([value, label]) => <Button role="tab" aria-selected={filter === value} variant={filter === value ? "primary" : "secondary"} size="sm" onClick={() => setFilter(value)} key={value}>{label}</Button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => { const sameStage = media.filter(({ stage }) => stage === item.stage); const stageIndex = sameStage.findIndex(({ id }) => id === item.id); return <article className="overflow-hidden rounded-xl border border-[var(--neutral-200)]" key={item.id}><div className="relative aspect-[4/3]"><MediaFallback src={urls[item.id] ?? MOCK_ASSETS[item.mockAssetKey]} alt={item.altText} className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" /><label className="absolute left-3 top-3 flex min-h-11 items-center gap-2 rounded-xl bg-white/95 px-3 text-sm font-bold"><input type="checkbox" aria-label={`${item.altText} 사진 선택`} checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })} />선택</label></div><div className="grid gap-3 p-3"><select aria-label={`${item.altText} 단계`} value={item.stage} onChange={(event) => patch(item.id, { stage: event.target.value as MediaStage })} className="admin-select"><option value="before">작업 전</option><option value="process">작업 과정</option><option value="after">작업 후</option><option value="detail">세부</option></select><div className="grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" aria-label={`${item.altText} 위로 이동`} disabled={stageIndex === 0} onClick={() => move(item.id, -1)}><ArrowUp size={16} />앞으로</Button><Button size="sm" variant="secondary" aria-label={`${item.altText} 아래로 이동`} disabled={stageIndex === sameStage.length - 1} onClick={() => move(item.id, 1)}><ArrowDown size={16} />뒤로</Button></div><label className="text-sm font-semibold">대체 텍스트<Input aria-label={`${item.altText} 대체 텍스트`} defaultValue={item.altText} onBlur={(event) => patch(item.id, { altText: event.target.value })} /></label><label className="text-sm font-semibold">캡션<Input aria-label={`${item.altText} 캡션`} defaultValue={item.caption} onBlur={(event) => patch(item.id, { caption: event.target.value })} /></label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={item.public} onChange={(event) => patch(item.id, { public: event.target.checked, cover: event.target.checked ? item.cover : false })} />고객 공개</label><label className="flex min-h-11 items-center gap-2"><input type="radio" name={`cover-${caseId}`} checked={item.cover} disabled={!item.public} onChange={() => patch(item.id, { cover: true })} />대표 사진</label></div></article>; })}</div></section>;
}
