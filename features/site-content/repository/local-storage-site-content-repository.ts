import { SITE_CONTENT_SEED_SNAPSHOT } from "../model/seed";
import type { PublishContentResult, SiteContent, SiteContentSnapshot } from "../model/types";
import type { SiteContentRepository } from "./site-content-repository";

export const SITE_CONTENT_STORAGE_KEY = "hygiene-technology:site-content:v1";
const clone = <T,>(value: T): T => structuredClone(value);
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class LocalStorageSiteContentRepository implements SiteContentRepository {
  private snapshot: SiteContentSnapshot;
  private listeners = new Set<() => void>();
  constructor(private readonly storage: Storage, seed: SiteContentSnapshot = SITE_CONTENT_SEED_SNAPSHOT) {
    const saved = storage.getItem(SITE_CONTENT_STORAGE_KEY);
    try { this.snapshot = saved ? JSON.parse(saved) as SiteContentSnapshot : clone(seed); } catch { this.snapshot = clone(seed); }
  }
  getSnapshot() { return this.snapshot; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  updateDraft(patch: Partial<SiteContent>) { this.commit({ ...this.snapshot, draft: { ...this.snapshot.draft, ...clone(patch) } }); }
  async saveDraft() { return undefined; }
  publish(): PublishContentResult {
    const issues: string[] = [];
    if (!this.snapshot.draft.home.title.trim()) issues.push("홈 제목을 입력해 주세요.");
    if (!this.snapshot.draft.home.heroImageAlt.trim()) issues.push("대표 이미지 대체 텍스트를 입력해 주세요.");
    if (!this.snapshot.draft.priceItems.some((item) => item.visible)) issues.push("공개 가격 항목이 한 개 이상 필요합니다.");
    if (issues.length) return { ok: false, issues };
    const content = clone(this.snapshot.draft);
    this.commit({ draft: content, published: clone(content), versions: [{ id: newId(), createdAt: new Date().toISOString(), content: clone(content) }, ...this.snapshot.versions].slice(0, 10) });
    return { ok: true };
  }
  restoreVersion(id: string) { const version = this.snapshot.versions.find((item) => item.id === id); if (!version) throw new Error("복원할 버전을 찾을 수 없습니다."); this.commit({ ...this.snapshot, draft: clone(version.content) }); }
  resetToSeed() { this.commit(clone(SITE_CONTENT_SEED_SNAPSHOT)); }
  private commit(next: SiteContentSnapshot) { this.snapshot = clone(next); this.storage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(this.snapshot)); this.listeners.forEach((listener) => listener()); }
}
