import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminCaseFilter,
  CaseMedia,
  CaseVideo,
  CreateDraftInput,
  MockStoreEnvelope,
  PortfolioCase,
  PortfolioQuery,
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
import { mapCaseMediaRow, mapCaseVideoRow, mapPortfolioCaseRow, mapServiceRow, mapTagRow } from "./supabase-mappers";

type Row = Record<string, unknown>;
const EMPTY_SNAPSHOT: MockStoreEnvelope = { schemaVersion: 1, savedAt: "1970-01-01T00:00:00.000Z", services: [], cases: [], media: [], videos: [], tags: [], caseTagIds: {} };
const clone = <T,>(value: T): T => structuredClone(value);

export interface PortfolioRemoteGateway {
  loadSnapshot(): Promise<MockStoreEnvelope>;
  createDraft(row: Row): Promise<Row>;
  updateCase(id: string, row: Row): Promise<Row>;
  replaceMedia(caseId: string, media: CaseMedia[]): Promise<void>;
  replaceVideos(caseId: string, videos: CaseVideo[]): Promise<void>;
  replaceTags(caseId: string, tagIds: string[]): Promise<void>;
  transition(name: "publish_case" | "unpublish_case" | "soft_delete_case", caseId: string): Promise<Row>;
}

function requireData<T>(result: { data: T | null; error: { message?: string } | null }, fallback: T): T {
  if (result.error) throw new Error(result.error.message || "Supabase 요청에 실패했습니다.");
  return result.data ?? fallback;
}

function uuidOrUndefined(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}

export class SupabasePortfolioGateway implements PortfolioRemoteGateway {
  constructor(private readonly client: SupabaseClient) {}

  async loadSnapshot(): Promise<MockStoreEnvelope> {
    const [services, cases, media, videos, tags, caseTags] = await Promise.all([
      this.client.from("services").select("*").order("sort_order"),
      this.client.from("portfolio_cases").select("*").order("updated_at", { ascending: false }),
      this.client.from("case_media").select("*").order("sort_order"),
      this.client.from("case_videos").select("*").order("sort_order"),
      this.client.from("tags").select("*").order("sort_order"),
      this.client.from("case_tags").select("case_id,tag_id"),
    ]);
    const serviceRows = requireData(services, []) as Row[];
    const caseRows = requireData(cases, []) as Row[];
    const mediaRows = requireData(media, []) as Row[];
    const videoRows = requireData(videos, []) as Row[];
    const tagRows = requireData(tags, []) as Row[];
    const linkRows = requireData(caseTags, []) as Row[];
    const caseTagIds: Record<string, string[]> = {};
    for (const link of linkRows) (caseTagIds[String(link.case_id)] ??= []).push(String(link.tag_id));
    return {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      services: serviceRows.map(mapServiceRow),
      cases: caseRows.map(mapPortfolioCaseRow),
      media: mediaRows.map(mapCaseMediaRow),
      videos: videoRows.map(mapCaseVideoRow),
      tags: tagRows.map(mapTagRow),
      caseTagIds,
    };
  }

  async createDraft(row: Row) {
    const result = await this.client.from("portfolio_cases").insert(row).select("*").single();
    return requireData(result, {} as Row) as Row;
  }

  async updateCase(id: string, row: Row) {
    const result = await this.client.from("portfolio_cases").update(row).eq("id", id).select("*").single();
    return requireData(result, {} as Row) as Row;
  }

  async replaceMedia(caseId: string, media: CaseMedia[]) {
    const removed = await this.client.from("case_media").delete().eq("case_id", caseId);
    requireData(removed, null);
    if (!media.length) return;
    const rows = media.map((item) => ({
      ...(uuidOrUndefined(item.id) ? { id: item.id } : {}), case_id: caseId, stage: item.stage, sort_order: item.sortOrder,
      is_cover: item.cover, is_public: item.public, alt_text: item.altText, caption: item.caption,
      width: item.width, height: item.height, mime_type: item.mimeType, size_bytes: item.sizeBytes,
      upload_status: item.uploadStatus, mock_asset_key: item.mockAssetKey || null,
      storage_path: item.storagePath || null, original_storage_path: item.originalStoragePath || null,
    }));
    requireData(await this.client.from("case_media").insert(rows), null);
  }

  async replaceVideos(caseId: string, videos: CaseVideo[]) {
    requireData(await this.client.from("case_videos").delete().eq("case_id", caseId), null);
    if (!videos.length) return;
    const rows = videos.map((item) => ({
      ...(uuidOrUndefined(item.id) ? { id: item.id } : {}), case_id: caseId, youtube_video_id: item.youtubeVideoId,
      original_url: item.originalUrl, title: item.title, caption: item.caption, sort_order: item.sortOrder, is_public: item.public,
    }));
    requireData(await this.client.from("case_videos").insert(rows), null);
  }

  async replaceTags(caseId: string, tagIds: string[]) {
    requireData(await this.client.from("case_tags").delete().eq("case_id", caseId), null);
    if (tagIds.length) requireData(await this.client.from("case_tags").insert([...new Set(tagIds)].map((tagId) => ({ case_id: caseId, tag_id: tagId }))), null);
  }

  async transition(name: "publish_case" | "unpublish_case" | "soft_delete_case", caseId: string) {
    const result = await this.client.rpc(name, { case_id: caseId });
    return requireData(result, {} as Row) as Row;
  }
}

export class SupabasePortfolioRepository implements PortfolioRepository {
  private snapshot = clone(EMPTY_SNAPSHOT);
  private readonly listeners = new Set<() => void>();

  constructor(private readonly remote: PortfolioRemoteGateway) {}
  getSnapshot() { return clone(this.snapshot); }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async hydrate() { this.snapshot = await this.remote.loadSnapshot(); this.emit(); }
  listServices() { return clone(this.snapshot.services).sort((a, b) => a.sortOrder - b.sortOrder); }
  listPublicCases(query: PortfolioQuery) { return clone(selectPublicCases(this.snapshot, query)); }
  getPublicCaseBySlug(slug: string) { return clone(selectPublicCaseBySlug(this.snapshot, slug)); }
  listRelatedPublicCases(caseId: string, limit: number) { return clone(selectRelatedPublicCases(this.snapshot, caseId, limit)); }
  listAdminCases(filter: AdminCaseFilter) { return clone(selectAdminCases(this.snapshot, filter)); }
  getAdminCaseById(id: string) { return clone(selectAdminCaseById(this.snapshot, id)); }

  async createDraft(input: CreateDraftInput) {
    const row = await this.remote.createDraft({
      service_id: input.serviceId, title: input.title, location_display: input.locationDisplay,
      status: "private", summary: "", space_type: "", display_period: "", problem_description: "", work_description: "", result_description: "",
    });
    await this.hydrate();
    return mapPortfolioCaseRow(row);
  }

  async updateCase(id: string, patch: UpdateCaseInput) {
    const row = await this.remote.updateCase(id, {
      ...(patch.serviceId !== undefined ? { service_id: patch.serviceId } : {}),
      ...(patch.slug !== undefined ? { slug: patch.slug } : {}), ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}), ...(patch.locationDisplay !== undefined ? { location_display: patch.locationDisplay } : {}),
      ...(patch.spaceType !== undefined ? { space_type: patch.spaceType } : {}), ...(patch.workDate !== undefined ? { work_date: patch.workDate || null } : {}),
      ...(patch.displayPeriod !== undefined ? { display_period: patch.displayPeriod } : {}), ...(patch.problemDescription !== undefined ? { problem_description: patch.problemDescription } : {}),
      ...(patch.workDescription !== undefined ? { work_description: patch.workDescription } : {}), ...(patch.resultDescription !== undefined ? { result_description: patch.resultDescription } : {}),
      ...(patch.seoTitle !== undefined ? { seo_title: patch.seoTitle || null } : {}), ...(patch.seoDescription !== undefined ? { seo_description: patch.seoDescription || null } : {}),
      ...(patch.featuredRank !== undefined ? { featured_rank: patch.featuredRank } : {}), ...(patch.privacyChecklist !== undefined ? { privacy_checklist: patch.privacyChecklist } : {}),
    });
    await this.hydrate();
    return mapPortfolioCaseRow(row);
  }

  async setCaseMedia(id: string, media: CaseMedia[]) { await this.remote.replaceMedia(id, media); await this.hydrate(); return clone(this.snapshot.media.filter((item) => item.caseId === id)); }
  async setCaseVideos(id: string, videos: CaseVideo[]) { await this.remote.replaceVideos(id, videos); await this.hydrate(); return clone(this.snapshot.videos.filter((item) => item.caseId === id)); }
  async setCaseTags(id: string, tagIds: string[]) { await this.remote.replaceTags(id, tagIds); await this.hydrate(); return clone(this.snapshot.caseTagIds[id] ?? []); }
  async publishCase(id: string): Promise<PublishResult> { try { const row = await this.remote.transition("publish_case", id); await this.hydrate(); return { ok: true, case: mapPortfolioCaseRow(row) }; } catch { return { ok: false, issues: [{ code: "privacy-checklist-incomplete", message: "공개 조건을 다시 확인해 주세요." }] }; } }
  async unpublishCase(id: string): Promise<PortfolioCase> { const row = await this.remote.transition("unpublish_case", id); await this.hydrate(); return mapPortfolioCaseRow(row); }
  async softDeleteCase(id: string) { await this.remote.transition("soft_delete_case", id); await this.hydrate(); }
  async resetToSeed() { throw new Error("운영 데이터는 목업 시드로 초기화할 수 없습니다."); }
  private emit() { this.listeners.forEach((listener) => listener()); }
}
