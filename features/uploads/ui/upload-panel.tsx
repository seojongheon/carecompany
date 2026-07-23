"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseMedia } from "@/features/portfolio/model/types";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createStorageGateway } from "@/features/portfolio/storage/storage-gateway";
import { SessionPreviewManager } from "../model/session-preview-manager";
import { runSimulatedUpload } from "../model/simulated-upload";
import { validateFileSelection } from "../model/upload-constraints";
import { UploadItem, type UploadListItem } from "./upload-item";
import { UploadLimitDialog } from "./upload-limit-dialog";
import { getCaseImageGuidance, type CaseImageUploadStage } from "../model/image-upload-guidance";
import { getUploadRuntime } from "../model/upload-runtime";
import { createSerialTaskQueue } from "../model/serial-task-queue";
import { ImageDropzone } from "./image-dropzone";

export function UploadPanel({ caseId, stage }: { caseId: string; stage: CaseImageUploadStage }) {
  const { snapshot, repository, setCaseMedia } = usePortfolio();
  const uploadRuntime = getUploadRuntime(repository, process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true");
  const storageEnabled = uploadRuntime === "supabase";
  const existing = snapshot.media.filter((item) => item.caseId === caseId);
  const manager = useMemo(() => new SessionPreviewManager(typeof URL.createObjectURL === "function" ? URL : { createObjectURL: (file: File) => `blob:mock/${file.name}`, revokeObjectURL: () => undefined }), []);
  const enqueuePersistence = useMemo(() => createSerialTaskQueue(), []);
  const fileById = useRef(new Map<string, File>());
  const [items, setItems] = useState<UploadListItem[]>([]);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => () => manager.reset(), [manager]);

  const persistReady = async (id: string, file: File) => {
    const latest = repository.getAdminCaseById(caseId)?.media ?? [];
    const uploaded = storageEnabled ? await createStorageGateway({ enabled: true, client: createBrowserSupabaseClient() }).uploadCaseFiles(caseId, [file]) : null;
    if (uploaded && !uploaded.ok) throw new Error(uploaded.code === "processing_failed" ? "이미지 검토본을 생성하지 못했습니다. JPG, PNG 또는 WebP 파일을 사용해 주세요." : "Supabase Storage에 사진을 저장하지 못했습니다.");
    const storageFile = uploaded?.ok ? uploaded.files[0] : null;
    const next: CaseMedia = {
      id: `media-${id}`, caseId, stage, sortOrder: latest.length,
      cover: false, public: false, altText: storageFile ? file.name : `${file.name} 목업 사진`, caption: storageFile ? "새로 업로드한 사진" : "새로 선택한 사진",
      width: 1600, height: 1200, mimeType: storageFile?.mimeType ?? file.type as CaseMedia["mimeType"], sizeBytes: storageFile?.sizeBytes ?? file.size,
      uploadStatus: "ready", mockAssetKey: storageFile ? "" : snapshot.services.find(({ id: serviceId }) => serviceId === snapshot.cases.find(({ id: currentId }) => currentId === caseId)?.serviceId)?.key ?? "bathroom",
      storagePath: storageFile?.reviewedPath, originalStoragePath: storageFile?.originalPath,
      sessionPreviewId: null,
    };
    await setCaseMedia(caseId, [...latest.filter((item) => item.id !== next.id), next]);
  };

  const start = (id: string, shouldFail: boolean) => {
    const file = fileById.current.get(id);
    if (!file) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: "uploading", error: null } : item));
    if (uploadRuntime === "supabase") {
      void enqueuePersistence(() => persistReady(id, file)).then(() => {
        setItems((current) => current.map((item) => item.id === id ? { ...item, status: "ready", progress: 100, error: null } : item));
      }).catch((error: unknown) => {
        setItems((current) => current.map((item) => item.id === id ? { ...item, status: "failed", error: error instanceof Error ? error.message : "사진을 저장하지 못했습니다." } : item));
      });
      return;
    }
    void runSimulatedUpload({ id, shouldFail, onProgress: (progress) => setItems((current) => current.map((item) => item.id === id ? { ...item, progress } : item)) }).then((result) => {
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: result.status, progress: result.progress, error: result.error } : item));
      if (result.status === "ready" && uploadRuntime === "mock") void enqueuePersistence(() => persistReady(id, file)).catch((error: unknown) => {
        setItems((current) => current.map((item) => item.id === id ? { ...item, status: "failed", error: error instanceof Error ? error.message : "사진을 저장하지 못했습니다." } : item));
      });
    });
  };

  const select = (files: File[]) => {
    const result = validateFileSelection(files, existing.length + items.filter(({ status }) => status === "uploading").length);
    if (result.issues.length) setLimitMessage(result.issues.map(({ message }) => message).join(" "));
    for (const file of result.accepted) {
      const preview = manager.add(file);
      fileById.current.set(preview.id, file);
      setItems((current) => [...current, { id: preview.id, name: file.name, objectUrl: preview.objectUrl, progress: 0, status: "uploading", error: null }]);
      start(preview.id, file.name.toLowerCase().includes("fail"));
    }
  };

  const full = existing.length >= 69;
  const guidance = getCaseImageGuidance(stage);
  const persistenceNotice = uploadRuntime === "supabase"
    ? "선택한 사진은 Supabase Storage에 실제 저장되며, 새로고침 후에도 유지됩니다."
    : uploadRuntime === "deferred"
      ? "Storage는 아직 활성화되지 않았습니다. 지금 선택한 사진은 저장 전 미리보기이며, Storage 활성화 후 실제 저장됩니다."
      : "명시적으로 주입된 로컬 테스트 저장소를 사용 중입니다. 실제 서비스 화면에서는 Supabase에 저장됩니다.";
  return <section className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><div><h2 className="text-xl font-black">{guidance.label} 업로드</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">현재 전체 {existing.length} / 69장 · 남은 수량 {Math.max(0, 69 - existing.length)}장</p></div><div className="mt-5"><ImageDropzone guidance={guidance} multiple disabled={full} onFiles={select} /></div><p className={`mt-4 rounded-xl p-3 text-sm ${uploadRuntime === "supabase" ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>{persistenceNotice}</p>{items.length ? <ul className="mt-4 grid gap-3">{items.map((item) => <UploadItem key={item.id} item={item} onRetry={() => start(item.id, false)} onRemove={() => { manager.remove(item.id); fileById.current.delete(item.id); setItems((current) => current.filter(({ id }) => id !== item.id)); }} />)}</ul> : null}{limitMessage ? <UploadLimitDialog message={limitMessage} onClose={() => setLimitMessage(null)} /> : null}</section>;
}
