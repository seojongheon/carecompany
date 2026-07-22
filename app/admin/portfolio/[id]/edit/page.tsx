import { AdminCaseForm } from "@/features/portfolio/ui/admin-case-form";
import { AdminPublishingWorkspace } from "@/features/portfolio/ui/admin-publishing-workspace";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><AdminCaseForm mode="edit" caseId={id} /><AdminPublishingWorkspace caseId={id} /></>; }
