import { MockStoreEnvelopeSchema, PortfolioCaseSchema } from "../model/schemas";
import type {
  AdminCaseFilter,
  CaseMedia,
  CaseVideo,
  CreateDraftInput,
  MockStoreEnvelope,
  PortfolioCase,
  PortfolioQuery,
  PublishIssueCode,
  PublishResult,
  UpdateCaseInput,
} from "../model/types";
import {
  selectAdminCaseById,
  selectAdminCases,
  selectPublicCaseBySlug,
  selectPublicCases,
  selectRelatedPublicCases,
} from "../selectors/portfolio-selectors";
import type { PortfolioRepository } from "./portfolio-repository";

export const PORTFOLIO_STORAGE_KEY = "hygiene-technology:portfolio:v1";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class LocalStoragePortfolioRepository implements PortfolioRepository {
  private snapshot: MockStoreEnvelope;
  private readonly initialSeed: MockStoreEnvelope;
  private readonly listeners = new Set<() => void>();
  private recoveryNotice: string | null = null;

  constructor(
    private readonly storage: Storage,
    seed: Readonly<MockStoreEnvelope>,
  ) {
    const seedCopy = clone(seed) as MockStoreEnvelope;
    this.initialSeed = clone(seedCopy);
    let stored: string | null;
    try {
      stored = storage.getItem(PORTFOLIO_STORAGE_KEY);
    } catch {
      this.snapshot = seedCopy;
      this.recoveryNotice = "브라우저 저장소를 사용할 수 없어 현재 화면에서만 목업 데이터를 유지합니다.";
      return;
    }
    if (!stored) {
      this.snapshot = seedCopy;
      return;
    }
    try {
      this.snapshot = MockStoreEnvelopeSchema.parse(JSON.parse(stored));
    } catch {
      const recoveryKey = `${PORTFOLIO_STORAGE_KEY}:recovery:${Date.now()}`;
      this.snapshot = seedCopy;
      try {
        storage.setItem(recoveryKey, stored);
        storage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(this.snapshot));
        this.recoveryNotice = "저장 데이터가 손상되어 안전한 기본 사례로 복구했습니다.";
      } catch {
        this.recoveryNotice = "저장 데이터가 손상되었고 브라우저 저장소를 사용할 수 없어 현재 화면의 기본 사례로 복구했습니다.";
      }
    }
  }

  getSnapshot() {
    return clone(this.snapshot);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  consumeRecoveryNotice() {
    const notice = this.recoveryNotice;
    this.recoveryNotice = null;
    return notice;
  }

  listServices() {
    return clone(this.snapshot.services).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  listPublicCases(query: PortfolioQuery) {
    return clone(selectPublicCases(this.snapshot, query));
  }

  getPublicCaseBySlug(slug: string) {
    return clone(selectPublicCaseBySlug(this.snapshot, slug));
  }

  listRelatedPublicCases(caseId: string, limit: number) {
    return clone(selectRelatedPublicCases(this.snapshot, caseId, limit));
  }

  listAdminCases(filter: AdminCaseFilter) {
    return clone(selectAdminCases(this.snapshot, filter));
  }

  getAdminCaseById(id: string) {
    return clone(selectAdminCaseById(this.snapshot, id));
  }

  createDraft(input: CreateDraftInput) {
    const now = new Date().toISOString();
    const draft: PortfolioCase = PortfolioCaseSchema.parse({
      id: `case-${newId()}`,
      serviceId: input.serviceId,
      slug: `case-${newId()}`,
      title: input.title,
      summary: "새 작업 사례의 설명을 입력해 주세요.",
      locationDisplay: input.locationDisplay,
      spaceType: "공간 유형 미입력",
      workDate: now.slice(0, 10),
      displayPeriod: "작업 시기 미입력",
      problemDescription: "작업 전 상태를 입력해 주세요.",
      workDescription: "작업 내용을 입력해 주세요.",
      resultDescription: "작업 결과를 입력해 주세요.",
      status: "private",
      featuredRank: null,
      privacyChecklist: {
        noIdentifiablePeople: false,
        noVehiclePlates: false,
        noDetailedAddressOrContact: false,
        noPrivateDocumentsOrBelongings: false,
        publicMediaReviewed: false,
        requiredMetadataComplete: true,
        hasPublicReadyMedia: false,
      },
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    if (!this.snapshot.services.some(({ id }) => id === draft.serviceId)) {
      throw new Error("존재하지 않는 서비스입니다.");
    }
    if (this.snapshot.cases.some(({ slug }) => slug === draft.slug)) {
      throw new Error("이미 사용 중인 사례 경로입니다.");
    }
    this.commit({ ...this.snapshot, cases: [...this.snapshot.cases, draft] });
    return clone(draft);
  }

  updateCase(id: string, patch: UpdateCaseInput) {
    const current = this.requireCase(id);
    const updated = PortfolioCaseSchema.parse({ ...current, ...patch, updatedAt: new Date().toISOString() });
    if (this.snapshot.cases.some((item) => item.id !== id && item.slug === updated.slug)) {
      throw new Error("이미 사용 중인 사례 경로입니다.");
    }
    this.commit({
      ...this.snapshot,
      cases: this.snapshot.cases.map((item) => (item.id === id ? updated : item)),
    });
    return clone(updated);
  }

  setCaseMedia(id: string, media: CaseMedia[]) {
    const current = this.requireCase(id);
    const reviewed = this.requireFreshReview(current);
    const next = {
      ...this.snapshot,
      cases: this.snapshot.cases.map((item) => item.id === id ? reviewed : item),
      media: [...this.snapshot.media.filter(({ caseId }) => caseId !== id), ...media.map((item) => ({ ...item, caseId: id }))],
    };
    this.commit(next);
    return clone(next.media.filter(({ caseId }) => caseId === id));
  }

  setCaseVideos(id: string, videos: CaseVideo[]) {
    const current = this.requireCase(id);
    const reviewed = this.requireFreshReview(current);
    const next = {
      ...this.snapshot,
      cases: this.snapshot.cases.map((item) => item.id === id ? reviewed : item),
      videos: [...this.snapshot.videos.filter(({ caseId }) => caseId !== id), ...videos.map((item) => ({ ...item, caseId: id }))],
    };
    this.commit(next);
    return clone(next.videos.filter(({ caseId }) => caseId === id));
  }

  setCaseTags(id: string, tagIds: string[]) {
    const current = this.requireCase(id);
    const unique = [...new Set(tagIds)];
    if (unique.some((tagId) => !this.snapshot.tags.some((tag) => tag.id === tagId && tag.serviceId === current.serviceId))) {
      throw new Error("사례와 태그의 서비스가 일치하지 않습니다.");
    }
    this.commit({ ...this.snapshot, caseTagIds: { ...this.snapshot.caseTagIds, [id]: unique } });
    return clone(unique);
  }

  publishCase(id: string): PublishResult {
    const current = this.requireCase(id);
    const media = this.snapshot.media.filter(({ caseId }) => caseId === id);
    const issues: Array<{ code: PublishIssueCode; message: string }> = [];
    if (current.status === "deleted") issues.push({ code: "deleted-case", message: "삭제된 사례는 공개할 수 없습니다." });
    if (!current.title.trim()) issues.push({ code: "missing-title", message: "제목을 입력해 주세요." });
    if (!this.snapshot.services.some(({ id: serviceId }) => serviceId === current.serviceId)) issues.push({ code: "missing-service", message: "서비스를 선택해 주세요." });
    if (!current.locationDisplay.trim()) issues.push({ code: "missing-location", message: "안전한 표시 지역을 입력해 주세요." });
    if (!media.some((item) => item.cover && item.public && item.uploadStatus === "ready")) issues.push({ code: "missing-cover", message: "공개 가능한 대표 사진을 선택해 주세요." });
    if (!media.some((item) => item.public && item.uploadStatus === "ready")) issues.push({ code: "missing-public-media", message: "공개 가능한 사진이 한 장 이상 필요합니다." });
    const privacyKeys = [
      "noIdentifiablePeople",
      "noVehiclePlates",
      "noDetailedAddressOrContact",
      "noPrivateDocumentsOrBelongings",
      "publicMediaReviewed",
    ] as const;
    if (privacyKeys.some((key) => !current.privacyChecklist[key])) {
      issues.push({ code: "privacy-checklist-incomplete", message: "개인정보 공개 검토 항목을 모두 확인해 주세요." });
    }
    if (issues.length) return { ok: false, issues };

    const now = new Date().toISOString();
    const published = PortfolioCaseSchema.parse({
      ...current,
      status: "published",
      publishedAt: now,
      updatedAt: now,
      privacyChecklist: {
        ...current.privacyChecklist,
        requiredMetadataComplete: true,
        hasPublicReadyMedia: true,
      },
    });
    this.commit({
      ...this.snapshot,
      cases: this.snapshot.cases.map((item) => (item.id === id ? published : item)),
    });
    return { ok: true, case: clone(published) };
  }

  unpublishCase(id: string) {
    const current = this.requireCase(id);
    const updated = PortfolioCaseSchema.parse({
      ...current,
      status: "private",
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    });
    this.commit({ ...this.snapshot, cases: this.snapshot.cases.map((item) => (item.id === id ? updated : item)) });
    return clone(updated);
  }

  softDeleteCase(id: string) {
    const current = this.requireCase(id);
    const updated = PortfolioCaseSchema.parse({
      ...current,
      status: "deleted",
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    });
    this.commit({ ...this.snapshot, cases: this.snapshot.cases.map((item) => (item.id === id ? updated : item)) });
  }

  resetToSeed() {
    const next = clone(this.initialSeed);
    this.snapshot = next;
    this.persistAndNotify();
  }

  private requireCase(id: string) {
    const item = this.snapshot.cases.find((portfolioCase) => portfolioCase.id === id);
    if (!item) throw new Error("사례를 찾을 수 없습니다.");
    return item;
  }

  private requireFreshReview(item: PortfolioCase) {
    if (item.status !== "published") return item;
    return PortfolioCaseSchema.parse({
      ...item,
      status: "private",
      publishedAt: null,
      updatedAt: new Date().toISOString(),
      privacyChecklist: { ...item.privacyChecklist, publicMediaReviewed: false },
    });
  }

  private commit(next: MockStoreEnvelope) {
    const candidate = MockStoreEnvelopeSchema.parse({ ...next, savedAt: new Date().toISOString() });
    this.snapshot = candidate;
    this.persistAndNotify();
  }

  private persistAndNotify() {
    this.storage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(this.snapshot));
    this.listeners.forEach((listener) => listener());
  }
}
