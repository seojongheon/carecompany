import type { SupabaseClient } from "@supabase/supabase-js";

import { SITE_CONTENT_SEED, SITE_CONTENT_SEED_SNAPSHOT } from "../model/seed";
import type { PriceItem, PublishContentResult, SiteContent, SiteContentSnapshot, SiteContentVersion } from "../model/types";
import type { SiteContentRepository } from "./site-content-repository";

type Row = Record<string, unknown>;
const clone = <T,>(value: T): T => structuredClone(value);

function normalizePriceItems(value: unknown): PriceItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Row => Boolean(item && typeof item === "object")).map((item) => ({
    id: String(item.id ?? ""), serviceKey: String(item.serviceKey ?? item.service_key ?? ""), name: String(item.name ?? ""),
    priceLabel: String(item.priceLabel ?? item.price_label ?? ""), conditions: Array.isArray(item.conditions) ? item.conditions.map(String) : [],
    visible: item.visible === true, sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
  }));
}

function normalizeContent(value: unknown, priceItems: PriceItem[] = []): SiteContent {
  const candidate = value && typeof value === "object" ? value as Partial<SiteContent> : {};
  return {
    home: { ...SITE_CONTENT_SEED.home, ...(candidate.home ?? {}) },
    pricingLead: typeof candidate.pricingLead === "string" ? candidate.pricingLead : SITE_CONTENT_SEED.pricingLead,
    priceItems: normalizePriceItems(candidate.priceItems).length ? normalizePriceItems(candidate.priceItems) : priceItems,
    processSteps: Array.isArray(candidate.processSteps) ? candidate.processSteps : clone(SITE_CONTENT_SEED.processSteps),
    about: { ...SITE_CONTENT_SEED.about, ...(candidate.about ?? {}) },
    settings: { ...SITE_CONTENT_SEED.settings, ...(candidate.settings ?? {}) },
  };
}

export interface SiteContentRemoteGateway {
  loadSnapshot(): Promise<SiteContentSnapshot>;
  saveDraft(content: SiteContent): Promise<void>;
  publish(): Promise<void>;
  restoreVersion(id: string): Promise<void>;
}

export class SupabaseSiteContentGateway implements SiteContentRemoteGateway {
  constructor(private readonly client: SupabaseClient) {}

  async loadSnapshot(): Promise<SiteContentSnapshot> {
    const { data: authData } = await this.client.auth.getSession();
    if (!authData.session) return this.loadPublishedSnapshot();

    const siteRow = await this.client.from("site_content").select("draft,published").eq("id", true).maybeSingle();
    if (!siteRow.error && siteRow.data) {
      const [versionsResult, pricesResult] = await Promise.all([
        this.client.from("site_content_versions").select("id,content,created_at").order("created_at", { ascending: false }).limit(10),
        this.client.from("price_items").select("id,service_key,name,price_label,conditions,visible,sort_order").order("sort_order"),
      ]);
      if (versionsResult.error) throw new Error(versionsResult.error.message);
      if (pricesResult.error) throw new Error(pricesResult.error.message);
      const priceItems = normalizePriceItems(pricesResult.data ?? []);
      const versions: SiteContentVersion[] = ((versionsResult.data ?? []) as Row[]).map((row) => ({ id: String(row.id), createdAt: String(row.created_at), content: normalizeContent(row.content, priceItems) }));
      return { draft: normalizeContent(siteRow.data.draft, priceItems), published: normalizeContent(siteRow.data.published, priceItems), versions };
    }

    // Anonymous visitors and customers cannot read drafts or version history.
    // The security-definer RPC returns only the published projection.
    return this.loadPublishedSnapshot();
  }

  private async loadPublishedSnapshot(): Promise<SiteContentSnapshot> {
    const publishedResult = await this.client.rpc("get_published_site_content");
    if (publishedResult.error) throw new Error(publishedResult.error.message);
    const published = normalizeContent(publishedResult.data);
    return { draft: clone(published), published, versions: [] };
  }

  async saveDraft(content: SiteContent) {
    const result = await this.client.rpc("update_site_content_draft", { content });
    if (result.error) throw new Error(result.error.message);
  }

  async publish() {
    const result = await this.client.rpc("publish_site_content");
    if (result.error) throw new Error(result.error.message);
  }

  async restoreVersion(id: string) {
    const result = await this.client.rpc("restore_site_content_version", { version_id: id });
    if (result.error) throw new Error(result.error.message);
  }
}

export class SupabaseSiteContentRepository implements SiteContentRepository {
  private snapshot = clone(SITE_CONTENT_SEED_SNAPSHOT);
  private readonly listeners = new Set<() => void>();
  constructor(private readonly remote: SiteContentRemoteGateway) {}
  getSnapshot() { return this.snapshot; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async hydrate() { this.snapshot = await this.remote.loadSnapshot(); this.emit(); }
  updateDraft(patch: Partial<SiteContent>) { this.snapshot = { ...this.snapshot, draft: { ...this.snapshot.draft, ...clone(patch) } }; this.emit(); }
  async saveDraft() { await this.remote.saveDraft(this.snapshot.draft); }
  async publish(): Promise<PublishContentResult> { try { await this.saveDraft(); await this.remote.publish(); await this.hydrate(); return { ok: true }; } catch { return { ok: false, issues: ["게시하지 못했습니다. 필수 항목과 관리자 권한을 확인해 주세요."] }; } }
  async restoreVersion(id: string) { await this.remote.restoreVersion(id); await this.hydrate(); }
  async resetToSeed() { throw new Error("운영 콘텐츠는 목업 시드로 초기화할 수 없습니다."); }
  private emit() { this.listeners.forEach((listener) => listener()); }
}
