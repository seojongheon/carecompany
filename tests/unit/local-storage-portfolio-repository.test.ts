import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import {
  LocalStoragePortfolioRepository,
  PORTFOLIO_STORAGE_KEY,
} from "@/features/portfolio/repository/local-storage-portfolio-repository";

describe("LocalStoragePortfolioRepository", () => {
  beforeEach(() => localStorage.clear());

  it("returns isolated snapshots that callers cannot mutate", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const first = repository.getSnapshot();
    first.cases[0].title = "외부에서 바꾼 제목";

    expect(repository.getSnapshot().cases[0].title).not.toBe("외부에서 바꾼 제목");
  });

  it("emits exactly one event for each persisted mutation", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    const draft = repository.createDraft({
      serviceId: "service-bathroom",
      title: "새 화장실 작업",
      slug: "new-bathroom-case",
      locationDisplay: "천안 서북구",
    });
    repository.updateCase(draft.id, { summary: "저장된 새 사례의 설명입니다." });
    unsubscribe();
    repository.updateCase(draft.id, { spaceType: "아파트" });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY) ?? "{}").cases).toHaveLength(21);
  });

  it("creates private drafts and restores them from storage", () => {
    const first = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = first.createDraft({
      serviceId: "service-aircon",
      title: "에어컨 초안",
      slug: "aircon-draft",
      locationDisplay: "아산 배방읍",
    });
    const restored = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);

    expect(draft.status).toBe("private");
    expect(restored.getAdminCaseById(draft.id)?.title).toBe("에어컨 초안");
    expect(restored.getPublicCaseBySlug(draft.slug)).toBeNull();
  });

  it("keeps failed publication atomic and removes unpublished cases immediately", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.createDraft({
      serviceId: "service-bathroom",
      title: "공개 준비 중",
      slug: "not-ready",
      locationDisplay: "천안 동남구",
    });

    const failed = repository.publishCase(draft.id);
    expect(failed.ok).toBe(false);
    expect(repository.getAdminCaseById(draft.id)?.status).toBe("private");

    const published = repository.listPublicCases({ limit: 50 }).items[0];
    repository.unpublishCase(published.id);
    expect(repository.getPublicCaseBySlug(published.slug)).toBeNull();
    expect(repository.listPublicCases({ limit: 50 }).items.some(({ id }) => id === published.id)).toBe(false);
  });

  it("publishes only after all derived media and privacy checks pass", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const original = repository.listPublicCases({ limit: 50 }).items[0];
    repository.unpublishCase(original.id);

    const result = repository.publishCase(original.id);

    expect(result.ok).toBe(true);
    expect(repository.getPublicCaseBySlug(original.slug)?.id).toBe(original.id);
  });

  it("recovers corrupt storage to seed, preserves a backup, and reports it", () => {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, "{broken-json");
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);

    expect(repository.getSnapshot().cases).toHaveLength(20);
    expect(repository.consumeRecoveryNotice()).toMatch(/복구/);
    expect(repository.consumeRecoveryNotice()).toBeNull();
    expect(Object.keys(localStorage).some((key) => key.startsWith(`${PORTFOLIO_STORAGE_KEY}:recovery:`))).toBe(true);
  });

  it("falls back safely when browser storage is unavailable and retains failed input in memory", () => {
    const blocked = {
      ...localStorage,
      get length() { return 0; },
      clear: vi.fn(), key: vi.fn(() => null), removeItem: vi.fn(),
      getItem: vi.fn(() => { throw new DOMException("blocked", "SecurityError"); }),
      setItem: vi.fn(() => { throw new DOMException("quota", "QuotaExceededError"); }),
    } as Storage;
    const repository = new LocalStoragePortfolioRepository(blocked, SEED_SNAPSHOT);
    const before = repository.getSnapshot();

    expect(repository.consumeRecoveryNotice()).toMatch(/브라우저 저장소/);
    expect(() => repository.updateCase(before.cases[0].id, { title: "저장되면 안 됨" })).toThrow();
    expect(repository.getSnapshot().cases[0].title).toBe("저장되면 안 됨");
  });

  it("soft-deletes public content and resets every change to seed", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const publicCase = repository.listPublicCases({ limit: 50 }).items[0];
    repository.softDeleteCase(publicCase.id);

    expect(repository.getPublicCaseBySlug(publicCase.slug)).toBeNull();
    repository.resetToSeed();

    expect(repository.getSnapshot().cases).toHaveLength(20);
    expect(repository.getPublicCaseBySlug(publicCase.slug)?.id).toBe(publicCase.id);
  });

  it("forces a fresh privacy review after published media changes and never republishes deleted cases", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const published = repository.listPublicCases({ limit: 1 }).items[0];
    const detail = repository.getAdminCaseById(published.id)!;

    repository.setCaseMedia(published.id, detail.media.map((media, index) => index === 0 ? { ...media, caption: "변경된 공개 캡션" } : media));
    const changed = repository.getAdminCaseById(published.id)!;
    expect(changed.status).toBe("private");
    expect(changed.privacyChecklist.publicMediaReviewed).toBe(false);
    expect(repository.getPublicCaseBySlug(published.slug)).toBeNull();

    repository.softDeleteCase(published.id);
    const result = repository.publishCase(published.id);
    expect(result.ok).toBe(false);
    expect(repository.getAdminCaseById(published.id)?.status).toBe("deleted");
  });

  it("orders featured cases first and paginates without duplicates", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const first = repository.listPublicCases({ limit: 5 });
    const second = repository.listPublicCases({ limit: 5, cursor: first.nextCursor ?? undefined });

    expect(first.items.map(({ featuredRank }) => featuredRank)).toEqual([1, 2, 3, 4, null]);
    expect(first.nextCursor).not.toBeNull();
    expect(second.items).toHaveLength(5);
    expect(second.items.some(({ id }) => first.items.some((item) => item.id === id))).toBe(false);
  });
});
