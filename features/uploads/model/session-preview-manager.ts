import type { SessionPreview } from "@/features/portfolio/model/types";

interface ObjectUrlApi {
  createObjectURL(file: File): string;
  revokeObjectURL(url: string): void;
}

export class SessionPreviewManager {
  private readonly previews = new Map<string, SessionPreview>();

  constructor(private readonly urlApi: ObjectUrlApi = URL) {}

  add(file: File) {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const preview: SessionPreview = {
      id,
      file,
      objectUrl: this.urlApi.createObjectURL(file),
      progress: 0,
      error: null,
    };
    this.previews.set(id, preview);
    return { ...preview };
  }

  update(id: string, patch: Partial<Pick<SessionPreview, "progress" | "error">>) {
    const current = this.previews.get(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    this.previews.set(id, next);
    return { ...next };
  }

  list() {
    return [...this.previews.values()].map((preview) => ({ ...preview }));
  }

  remove(id: string) {
    const preview = this.previews.get(id);
    if (!preview) return;
    this.urlApi.revokeObjectURL(preview.objectUrl);
    this.previews.delete(id);
  }

  reset() {
    for (const preview of this.previews.values()) {
      this.urlApi.revokeObjectURL(preview.objectUrl);
    }
    this.previews.clear();
  }
}

