import { UploadPanel } from "@/features/uploads/ui/upload-panel";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";
import { PublishChecklist } from "@/features/publishing/ui/publish-checklist";
import { YouTubeManager } from "./youtube-manager";

export function AdminPublishingWorkspace({ caseId }: { caseId: string }) {
  return <div className="mx-auto mt-8 grid max-w-5xl gap-6"><UploadPanel caseId={caseId} /><PhotoManager caseId={caseId} /><YouTubeManager caseId={caseId} /><PublishChecklist caseId={caseId} /></div>;
}

