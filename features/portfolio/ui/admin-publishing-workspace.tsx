"use client";

import { UploadPanel } from "@/features/uploads/ui/upload-panel";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";
import { PublishChecklist } from "@/features/publishing/ui/publish-checklist";
import { CaseRevisionControls } from "./case-revision-controls";
import { useAdminPortfolio } from "../repository/use-portfolio";
import { YouTubeManager } from "./youtube-manager";

export function AdminPublishingWorkspace({ caseId }: { caseId: string }) {
  const { snapshot } = useAdminPortfolio();
  const item = snapshot.cases.find(c => c.id === caseId);
  if (!item) return null;
  if (item.status === "deleted") return <div className="mx-auto mt-8 max-w-5xl"><CaseRevisionControls caseId={caseId} /></div>;
  return <div className="mx-auto mt-8 grid max-w-5xl gap-6"><CaseRevisionControls caseId={caseId} /><UploadPanel caseId={caseId} stage="before" /><UploadPanel caseId={caseId} stage="after" /><PhotoManager caseId={caseId} /><YouTubeManager caseId={caseId} /><PublishChecklist caseId={caseId} /></div>;
}
