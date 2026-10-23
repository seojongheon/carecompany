import { describe, expect, it } from "vitest";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { selectAdminSnapshot, applyRevisionPatch } from "@/features/portfolio/model/case-revisions";
import { selectPublicCaseBySlug } from "@/features/portfolio/selectors/portfolio-selectors";

const store = () => structuredClone(SEED_SNAPSHOT);
describe("case revision isolation", () => {
  it("keeps the public body and media intact while the editor sees its draft", () => {
    const snapshot = store(); const current = snapshot.cases.find(c => c.status === "published")!;
    current.updatedBy = "published-editor";
    const before = selectPublicCaseBySlug(snapshot, current.slug);
    const manifest = { case: { ...current, title: "수정 중", updatedBy: "draft-editor" }, media: [], videos: [], tagIds: [] };
    const withDraft = { ...snapshot, drafts: { [current.id]: { revision: 1, manifest } } };
    expect(selectAdminSnapshot(withDraft).cases.find(c => c.id === current.id)?.title).toBe("수정 중");
    expect(selectAdminSnapshot(withDraft).media.filter(m => m.caseId === current.id)).toEqual([]);
    expect(selectAdminSnapshot(withDraft).cases.find(c => c.id === current.id)?.updatedBy).toBe("draft-editor");
    expect(selectPublicCaseBySlug(withDraft, current.slug)).toEqual(before);
  });
  it("invalidates all privacy confirmations when a new public photo is added", () => {
    const snapshot = store(); const current = snapshot.cases[0];
    const media = snapshot.media.filter(m => m.caseId === current.id);
    const manifest = { case: current, media, videos: [], tagIds: [] };
    const result = applyRevisionPatch(manifest, { media: [...media, { ...media[0], id: "new-photo", storagePath: "new-file" }] });
    expect(result.case.privacyChecklist.publicMediaReviewed).toBe(false);
    expect(result.case.privacyChecklist.noIdentifiablePeople).toBe(false);
    expect(manifest.case.privacyChecklist.publicMediaReviewed).toBe(true);
  });
  it("keeps review when only the caption changes or public media is removed", () => {
    const snapshot = store(); const current = snapshot.cases[0];
    const media = snapshot.media.filter(m => m.caseId === current.id);
    const manifest = { case: current, media, videos: [], tagIds: [] };
    expect(applyRevisionPatch(manifest, { media: media.map(m => ({ ...m, caption: "수정" })) }).case.privacyChecklist.publicMediaReviewed).toBe(true);
    expect(applyRevisionPatch(manifest, { media: [] }).case.privacyChecklist.publicMediaReviewed).toBe(true);
  });
  it("rejects a draft above the case media and video limits", () => {
    const snapshot = store(); const current = snapshot.cases[0];
    const manifest = { case: current, media: [], videos: [], tagIds: [] };
    expect(() => applyRevisionPatch(manifest, { media: Array.from({ length: 70 }, (_, i) => ({ ...snapshot.media[0], id: String(i) })) })).toThrow("69");
    expect(() => applyRevisionPatch(manifest, { videos: Array.from({ length: 4 }, (_, i) => ({ ...snapshot.videos[0], id: String(i) })) })).toThrow("3");
  });
});

describe("local revision publication contract", () => {
  it("publishes one case without leaking another case draft", async () => {
    const { LocalStoragePortfolioRepository } = await import("@/features/portfolio/repository/local-storage-portfolio-repository");
    localStorage.clear();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const [first, second] = repository.listPublicCases({ limit: 2 }).items;
    const original = repository.getPublicCaseBySlug(second.slug);
    repository.updateCase(first.id, { title: "첫 사례 변경" });
    repository.updateCase(second.id, { title: "다른 미공개 변경" });
    const secondMedia = repository.getAdminCaseById(second.id)!.media;
    repository.setCaseMedia(second.id, secondMedia.map(m => ({ ...m, caption: "미공개 캡션" })));
    expect(repository.publishCase(first.id).ok).toBe(true);
    expect(repository.getPublicCaseBySlug(first.slug)?.title).toBe("첫 사례 변경");
    // Revision counters may advance; body and media remain the prior publication.
    const after = repository.getPublicCaseBySlug(second.slug)!;
    expect(after.title).toBe(original?.title);
    expect(after.media).toEqual(original?.media);
    expect(repository.getAdminCaseById(second.id)?.title).toBe("다른 미공개 변경");
  });
  it("restores history into a draft and discards it without changing public output", async () => {
    const { LocalStoragePortfolioRepository } = await import("@/features/portfolio/repository/local-storage-portfolio-repository");
    localStorage.clear();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const current = repository.listPublicCases({ limit: 1 }).items[0];
    repository.updateCase(current.id, { title: "이전 공개 제목" }); repository.publishCase(current.id);
    const historyId = repository.getSnapshot().history![current.id][0].id;
    repository.updateCase(current.id, { title: "현재 공개 제목" }); repository.publishCase(current.id);
    repository.restoreHistory(current.id, historyId);
    expect(repository.getAdminCaseById(current.id)?.title).toBe("이전 공개 제목");
    expect(repository.getPublicCaseBySlug(current.slug)?.title).toBe("현재 공개 제목");
    repository.discardDraft(current.id);
    expect(repository.getAdminCaseById(current.id)?.title).toBe("현재 공개 제목");
  });
});
