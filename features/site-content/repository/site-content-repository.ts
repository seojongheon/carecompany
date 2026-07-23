import type { PublishContentResult, SiteContent, SiteContentSnapshot } from "../model/types";

export interface SiteContentRepository {
  hydrate?(): Promise<void>;
  getSnapshot(): SiteContentSnapshot;
  subscribe(listener: () => void): () => void;
  updateDraft(patch: Partial<SiteContent>): void;
  saveDraft?(): Promise<void>;
  publish(): PublishContentResult | Promise<PublishContentResult>;
  restoreVersion(id: string): void | Promise<void>;
  resetToSeed(): void | Promise<void>;
}
