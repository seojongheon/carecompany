"use client";

import { UploadPanel } from "@/features/uploads/ui/upload-panel";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";
import { PublishChecklist } from "@/features/publishing/ui/publish-checklist";
import { CaseRevisionControls } from "./case-revision-controls";
import { useAdminPortfolio } from "../repository/use-portfolio";
import { YouTubeManager } from "./youtube-manager";

export function AdminPublishingWorkspace({ caseId, section = "all" }: { caseId: string; section?: "all" | "review" | "media" }) {
  const { snapshot } = useAdminPortfolio();
  const item = snapshot.cases.find(c => c.id === caseId);
  if (!item) return null;
  if (item.status === "deleted") return section === "media" ? null : <div className="grid gap-5"><CaseRevisionControls caseId={caseId} /></div>;
  return <div className="grid min-w-0 gap-5">
    {section !== "media" ? <section id="case-review" aria-label="게시 검토와 이력" className="grid scroll-mt-6 gap-5"><div className="admin-card rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><h2 className="text-xl font-bold">게시 상태</h2><p className="mt-2 text-sm text-[var(--neutral-600)]">{item.status === "published" ? "현재 공개본을 유지하며 수정 사항은 초안으로 저장됩니다." : "고객에게 보이지 않는 비공개 초안입니다."}</p><a className="mt-3 inline-flex min-h-11 items-center font-semibold text-[var(--brand-700)]" href="#case-photos">사진·개인정보 검토로 이동</a></div><PublishChecklist caseId={caseId} /><CaseRevisionControls caseId={caseId} /></section> : null}
    {section !== "review" ? <><section id="case-photos" aria-label="사례 사진" className="grid min-w-0 scroll-mt-6 gap-5"><div><h2 className="text-xl font-bold">사진</h2><p className="mt-2 text-sm text-[var(--neutral-500)]">한 번에 20장 · 사례당 최대 69장. 대표·공개 상태와 개인정보를 확인해 주세요.</p></div><UploadPanel caseId={caseId} stage="before" /><UploadPanel caseId={caseId} stage="after" /><PhotoManager caseId={caseId} /></section><section id="case-videos" aria-label="사례 영상" className="grid min-w-0 scroll-mt-6 gap-5"><h2 className="text-xl font-bold">영상</h2><YouTubeManager caseId={caseId} /></section></> : null}
  </div>;
}
