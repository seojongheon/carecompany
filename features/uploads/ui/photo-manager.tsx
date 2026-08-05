"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaFallback } from "@/components/portfolio/media-fallback";
import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { MediaStage } from "@/features/portfolio/model/types";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";
import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { createStorageGateway } from "@/features/portfolio/storage/storage-gateway";
import { enqueuePendingCaseCleanup, readPendingCaseCleanup, resolvePendingCaseCleanup } from "@/features/portfolio/storage/case-cleanup-queue";
import { useCaseMediaUrls } from "@/features/portfolio/storage/use-case-media-urls";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseStorageAllowed } from "../model/upload-runtime";

export function PhotoManager({ caseId }: { caseId: string }) {
  const { snapshot, repository, setCaseMedia } = usePortfolio();
  const media = snapshot.media.filter((item) => item.caseId === caseId).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const portfolioCase = snapshot.cases.find((item) => item.id === caseId);
  const service = snapshot.services.find((item) => item.id === portfolioCase?.serviceId);
  const urls = useCaseMediaUrls(media, service?.key);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<MediaStage | "all" | "private">("all");
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [pendingCleanup, setPendingCleanup] = useState<ReturnType<typeof readPendingCaseCleanup>>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pending = readPendingCaseCleanup();
      if (!pending.length) return;
      setPendingCleanup(pending);
      setRemoveError("이전에 완료하지 못한 Storage 파일 정리가 있습니다. 다시 시도해 주세요.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
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
      setRemoveError(null);
      if (repository instanceof SupabasePortfolioRepository) {
        const storageAllowed = isSupabaseStorageAllowed(
          process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true",
          process.env.NODE_ENV,
        );
        if (!storageAllowed) {
          setRemoveError("Storage가 비활성 상태라 원격 사진을 삭제할 수 없습니다.");
          return;
        }
      }
      const saved = await setCaseMedia(caseId, remaining);
      if (!saved) {
        setRemoveError("사진 정보를 삭제하지 못했습니다. 새로고침 후 상태를 확인해 주세요.");
        return;
      }
      if (repository instanceof SupabasePortfolioRepository) {
        const cleanupFiles = removed.map((item) => ({
          originalPath: item.originalStoragePath ?? "",
          reviewedPath: item.storagePath ?? "",
        }));
        const cleanup = await createStorageGateway({ enabled: true, client: createBrowserSupabaseClient() }).removeCaseFiles(cleanupFiles);
        if (!cleanup.ok) {
          setPendingCleanup(enqueuePendingCaseCleanup(cleanupFiles));
          setRemoveError("사진 정보는 안전하게 삭제했지만 Storage 파일 정리가 남았습니다. 다시 시도해 주세요.");
        }
      }
      setSelected(new Set());
    })();
  };

  const retryCleanup = () => {
    void (async () => {
      if (!isSupabaseStorageAllowed(
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true",
        process.env.NODE_ENV,
      )) {
        setRemoveError("Storage가 비활성 상태라 대기 중인 파일 정리를 실행하지 않았습니다.");
        return;
      }
      const cleanup = await createStorageGateway({ enabled: true, client: createBrowserSupabaseClient() }).removeCaseFiles(pendingCleanup);
      if (!cleanup.ok) {
        setRemoveError("Storage 파일 정리를 다시 완료하지 못했습니다. 잠시 후 재시도해 주세요.");
        return;
      }
      setPendingCleanup(resolvePendingCaseCleanup(pendingCleanup));
      setRemoveError(null);
    })();
  };

  return <section className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-black">사진 관리</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">{media.length} / 69장 · 단계 안에서 순서를 조정합니다.</p></div>{selected.size ? <div className="flex flex-wrap items-end gap-2 rounded-xl bg-[var(--brand-50)] p-2"><label className="text-xs font-bold">선택 사진 단계<select aria-label="선택 사진 단계" className="admin-select" defaultValue="detail" onChange={(event) => bulk({ stage: event.target.value as MediaStage })}><option value="before">작업 전</option><option value="process">작업 과정</option><option value="after">작업 후</option><option value="detail">세부</option></select></label><Button size="sm" onClick={() => bulk({ public: true })}>선택 사진 공개</Button><Button size="sm" variant="secondary" onClick={() => bulk({ public: false })}>선택 사진 비공개</Button><Button size="sm" variant="danger" onClick={removeSelected}><Trash2 size={16} />선택 삭제</Button></div> : null}</div>{removeError ? <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-900"><span>{removeError}</span>{pendingCleanup.length ? <Button size="sm" variant="secondary" onClick={retryCleanup}>Storage 정리 재시도</Button> : null}</div> : null}<div role="tablist" aria-label="사진 분류" className="mt-4 flex gap-2 overflow-x-auto pb-1">{([['all','전체'],['before','작업 전'],['process','작업 과정'],['after','작업 후'],['detail','세부'],['private','비공개 사진']] as const).map(([value, label]) => <Button role="tab" aria-selected={filter === value} variant={filter === value ? "primary" : "secondary"} size="sm" onClick={() => setFilter(value)} key={value}>{label}</Button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => { const sameStage = media.filter(({ stage }) => stage === item.stage); const stageIndex = sameStage.findIndex(({ id }) => id === item.id); return <article className="overflow-hidden rounded-xl border border-[var(--neutral-200)]" key={item.id}><div className="relative aspect-[4/3]"><MediaFallback src={urls[item.id] ?? MOCK_ASSETS[item.mockAssetKey]} alt={item.altText} className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" /><label className="absolute left-3 top-3 flex min-h-11 items-center gap-2 rounded-xl bg-white/95 px-3 text-sm font-bold"><input type="checkbox" aria-label={`${item.altText} 사진 선택`} checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })} />선택</label></div><div className="grid gap-3 p-3"><select aria-label={`${item.altText} 단계`} value={item.stage} onChange={(event) => patch(item.id, { stage: event.target.value as MediaStage })} className="admin-select"><option value="before">작업 전</option><option value="process">작업 과정</option><option value="after">작업 후</option><option value="detail">세부</option></select><div className="grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" aria-label={`${item.altText} 위로 이동`} disabled={stageIndex === 0} onClick={() => move(item.id, -1)}><ArrowUp size={16} />앞으로</Button><Button size="sm" variant="secondary" aria-label={`${item.altText} 아래로 이동`} disabled={stageIndex === sameStage.length - 1} onClick={() => move(item.id, 1)}><ArrowDown size={16} />뒤로</Button></div><label className="text-sm font-semibold">대체 텍스트<Input aria-label={`${item.altText} 대체 텍스트`} defaultValue={item.altText} onBlur={(event) => patch(item.id, { altText: event.target.value })} /></label><label className="text-sm font-semibold">캡션<Input aria-label={`${item.altText} 캡션`} defaultValue={item.caption} onBlur={(event) => patch(item.id, { caption: event.target.value })} /></label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={item.public} onChange={(event) => patch(item.id, { public: event.target.checked, cover: event.target.checked ? item.cover : false })} />고객 공개</label><label className="flex min-h-11 items-center gap-2"><input type="radio" name={`cover-${caseId}`} checked={item.cover} disabled={!item.public} onChange={() => patch(item.id, { cover: true })} />대표 사진</label></div></article>; })}</div></section>;
}
