import { describe, expect, it, beforeEach } from "vitest";

import { LocalStorageSiteContentRepository } from "@/features/site-content/repository/local-storage-site-content-repository";

describe("LocalStorageSiteContentRepository", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a changed home title in draft until it is published", () => {
    const repository = new LocalStorageSiteContentRepository(localStorage);

    repository.updateDraft({ home: { ...repository.getSnapshot().draft.home, title: "새로운 현장 청소 이야기" } });

    expect(repository.getSnapshot().draft.home.title).toBe("새로운 현장 청소 이야기");
    expect(repository.getSnapshot().published.home.title).not.toBe("새로운 현장 청소 이야기");
  });

  it("keeps snapshot identity stable until content changes", () => {
    const repository = new LocalStorageSiteContentRepository(localStorage);
    const first = repository.getSnapshot();
    expect(repository.getSnapshot()).toBe(first);
    repository.updateDraft({ home: { ...first.draft.home, title: "변경" } });
    expect(repository.getSnapshot()).not.toBe(first);
  });

  it("publishes valid content and keeps a version that can be restored to draft", () => {
    const repository = new LocalStorageSiteContentRepository(localStorage);
    repository.updateDraft({ home: { ...repository.getSnapshot().draft.home, title: "게시할 제목" } });

    expect(repository.publish()).toEqual({ ok: true });
    expect(repository.getSnapshot().published.home.title).toBe("게시할 제목");

    const version = repository.getSnapshot().versions[0];
    repository.updateDraft({ home: { ...repository.getSnapshot().draft.home, title: "다른 초안" } });
    repository.restoreVersion(version.id);

    expect(repository.getSnapshot().draft.home.title).toBe("게시할 제목");
  });

  it("blocks publishing when the hero image alt text is empty", () => {
    const repository = new LocalStorageSiteContentRepository(localStorage);
    repository.updateDraft({ home: { ...repository.getSnapshot().draft.home, heroImageAlt: "" } });

    expect(repository.publish()).toEqual({ ok: false, issues: ["대표 이미지 대체 텍스트를 입력해 주세요."] });
  });
});
