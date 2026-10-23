import type { CaseMedia, CaseVideo, MockStoreEnvelope, PortfolioCase } from "./types";

export interface CaseManifest { case: PortfolioCase; media: CaseMedia[]; videos: CaseVideo[]; tagIds: string[] }
export interface CaseRevision { revision: number; manifest: CaseManifest }
export interface CaseHistory extends CaseRevision { id: string; createdAt: string }
export type CaseRevisionPatch = { case?: Partial<PortfolioCase>; media?: CaseMedia[]; videos?: CaseVideo[]; tagIds?: string[] };

export function selectAdminSnapshot(snapshot: MockStoreEnvelope): MockStoreEnvelope {
  const next = structuredClone(snapshot);
  for (const [id, draft] of Object.entries(next.drafts ?? {})) {
    const { manifest } = draft;
    next.cases = next.cases.map(item => item.id === id ? { ...manifest.case, id, status: item.status, publishedAt: item.publishedAt, revision: item.revision, updatedBy: manifest.case.updatedBy ?? item.updatedBy, hasDraft: true } : item);
    next.media = [...next.media.filter(item => item.caseId !== id), ...manifest.media.map(item => ({ ...item, caseId: id }))];
    next.videos = [...next.videos.filter(item => item.caseId !== id), ...manifest.videos.map(item => ({ ...item, caseId: id }))];
    next.caseTagIds[id] = manifest.tagIds;
  }
  return next;
}

export function applyRevisionPatch(current: CaseManifest, patch: CaseRevisionPatch): CaseManifest {
  const next = structuredClone({ ...current, ...patch, case: { ...current.case, ...patch.case } });
  if (patch.case?.serviceId && patch.case.serviceId !== current.case.serviceId && !patch.tagIds) next.tagIds = [];
  if (next.media.length > 69) throw new Error("사진은 사례당 69장까지 등록할 수 있습니다.");
  if (next.videos.length > 3) throw new Error("영상은 사례당 3개까지 등록할 수 있습니다.");
  const newPublicMedia = next.media.some(item => item.public && !current.media.some(old => old.public && old.id === item.id && old.storagePath === item.storagePath && old.mockAssetKey === item.mockAssetKey));
  if (newPublicMedia) next.case.privacyChecklist = { ...next.case.privacyChecklist, noIdentifiablePeople: false, noVehiclePlates: false, noDetailedAddressOrContact: false, noPrivateDocumentsOrBelongings: false, publicMediaReviewed: false };
  return next;
}
