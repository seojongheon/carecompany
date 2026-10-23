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
  Tag,
} from "../model/types";
import {
  selectAdminCaseById,
  selectAdminCases,
  selectPublicCaseBySlug,
  selectPublicCases,
  selectRelatedPublicCases,
} from "../selectors/portfolio-selectors";
import { selectAdminSnapshot } from "../model/case-revisions";
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
  discardDraft?(caseId: string): Promise<void>;
  restoreHistory?(caseId: string, historyId: string): Promise<void>;
  restoreDeleted?(caseId: string): Promise<void>;
  saveTag?(tag: Tag): Promise<void>;
  transition(name: "publish_case" | "unpublish_case" | "soft_delete_case", caseId: string): Promise<Row>;
}

function requireData<T>(result: { data: T | null; error: { message?: string } | null }, fallback: T): T {
  if (result.error) throw new Error(result.error.message || "Supabase 요청에 실패했습니다.");
  return result.data ?? fallback;
}

export class SupabasePortfolioGateway implements PortfolioRemoteGateway {
  private revisions = new Map<string, number>();
  constructor(private readonly client: SupabaseClient) {}

  private async save(caseId: string, patch: Row) {
    const result = requireData(await this.client.rpc("save_case_revision", { case_id: caseId, expected_revision: this.revisions.get(caseId) ?? 0, patch }), {} as Row) as Row;
    this.revisions.set(caseId, Number(result.revision ?? (this.revisions.get(caseId) ?? 0) + 1));
    return result;
  }

  async loadSnapshot(): Promise<MockStoreEnvelope> {
    const { data: { user } } = await this.client.auth.getUser();
    const profile = user ? await this.client.from("profiles").select("role,is_active").eq("id", user.id).single() : null;
    if (profile?.error) throw new Error("관리자 권한을 확인하지 못했습니다.");
    const staff = profile?.data?.is_active && ["admin", "super_admin"].includes(profile.data.role);
    const [services, cases, media, videos, tags, caseTags, drafts, history] = await Promise.all([
      this.client.from("services").select("*").order("sort_order"),
      this.client.from("portfolio_cases").select("*").order("updated_at", { ascending: false }),
      this.client.from("case_media").select("*").order("sort_order"),
      this.client.from("case_videos").select("*").order("sort_order"),
      this.client.from("tags").select("*").order("sort_order"),
      this.client.from("case_tags").select("case_id,tag_id"),
      staff ? this.client.from("case_revision_drafts").select("*") : Promise.resolve({ data: [], error: null }),
      staff ? this.client.from("case_revision_history").select("*").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ]);
    const serviceRows = requireData(services, []) as Row[];
    const caseRows = requireData(cases, []) as Row[];
    const mediaRows = requireData(media, []) as Row[];
    const videoRows = requireData(videos, []) as Row[];
    const tagRows = requireData(tags, []) as Row[];
    const linkRows = requireData(caseTags, []) as Row[];
    const draftRows = requireData(drafts, []) as Row[];
    const historyRows = requireData(history, []) as Row[];
    this.revisions = new Map(caseRows.map(row => [String(row.id), Number(row.revision ?? 0)]));
    const caseTagIds: Record<string, string[]> = {};
    for (const link of linkRows) (caseTagIds[String(link.case_id)] ??= []).push(String(link.tag_id));
    return {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      services: serviceRows.map(mapServiceRow),
      cases: caseRows.map(row => ({ ...mapPortfolioCaseRow(row), revision: Number(row.revision ?? 0), hasDraft: draftRows.some(d => d.case_id === row.id) })),
      drafts: Object.fromEntries(draftRows.map(row => [String(row.case_id), { revision: Number(row.revision), manifest: row.manifest as import("../model/case-revisions").CaseManifest }])),
      history: Object.fromEntries(caseRows.map(row => [String(row.id), historyRows.filter(h => h.case_id === row.id).map(h => ({ id: String(h.id), revision: Number(h.revision), createdAt: String(h.created_at), manifest: h.manifest as import("../model/case-revisions").CaseManifest }))])),
      media: mediaRows.map(mapCaseMediaRow),
      videos: videoRows.map(mapCaseVideoRow),
      tags: tagRows.map(mapTagRow),
      caseTagIds,
    };
  }

  async createDraft(row: Row) {
    return requireData(await this.client.rpc("create_case_revision", { body: row }), {} as Row) as Row;
  }

  async updateCase(id: string, row: Row) {
    const names: Record<string, string> = { service_id: "serviceId", location_display: "locationDisplay", space_type: "spaceType", work_date: "workDate", display_period: "displayPeriod", problem_description: "problemDescription", work_description: "workDescription", result_description: "resultDescription", seo_title: "seoTitle", seo_description: "seoDescription", featured_rank: "featuredRank", privacy_checklist: "privacyChecklist" };
    return this.save(id, { case: Object.fromEntries(Object.entries(row).map(([key, value]) => [names[key] ?? key, value])) });
  }
  async replaceMedia(caseId: string, media: CaseMedia[]) { await this.save(caseId, { media }); }
  async replaceVideos(caseId: string, videos: CaseVideo[]) { await this.save(caseId, { videos }); }
  async replaceTags(caseId: string, tagIds: string[]) { await this.save(caseId, { tagIds }); }
  async discardDraft(caseId: string) { requireData(await this.client.rpc("discard_case_revision", { case_id: caseId, expected_revision: this.revisions.get(caseId) ?? 0 }), null); }
  async restoreHistory(caseId: string, historyId: string) { requireData(await this.client.rpc("restore_case_revision", { case_id: caseId, history_id: historyId, expected_revision: this.revisions.get(caseId) ?? 0 }), null); }
  async restoreDeleted(caseId: string) { requireData(await this.client.rpc("transition_case_revision", { case_id: caseId, operation: "restore", expected_revision: this.revisions.get(caseId) ?? 0 }), null); }
  async saveTag(tag: Tag) { requireData(await this.client.rpc("save_case_tag", { tag }), null); }
  async transition(name: "publish_case" | "unpublish_case" | "soft_delete_case", caseId: string) {
    const result = await this.client.rpc(name === "publish_case" ? "publish_case_revision" : "transition_case_revision", {
      case_id: caseId, expected_revision: this.revisions.get(caseId) ?? 0,
      ...(name === "publish_case" ? {} : { operation: name === "unpublish_case" ? "unpublish" : "trash" }),
    });
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
  listAdminCases(filter: AdminCaseFilter) { return clone(selectAdminCases(selectAdminSnapshot(this.snapshot), filter)); }
  getAdminCaseById(id: string) { return clone(selectAdminCaseById(selectAdminSnapshot(this.snapshot), id)); }

  async createDraft(input: CreateDraftInput) {
    const row = await this.remote.createDraft({
      service_id: input.serviceId, title: input.title, location_display: input.locationDisplay,
      status: "private", summary: "", space_type: "", display_period: "", problem_description: "", work_description: "", result_description: "",
    });
    await this.hydrate();
    return mapPortfolioCaseRow(row);
  }

  async updateCase(id: string, patch: UpdateCaseInput) {
    await this.remote.updateCase(id, {
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
    return this.getAdminCaseById(id)!;
  }

  async setCaseMedia(id: string, media: CaseMedia[]) { await this.remote.replaceMedia(id, media); await this.hydrate(); return clone(selectAdminSnapshot(this.snapshot).media.filter((item) => item.caseId === id)); }
  async setCaseVideos(id: string, videos: CaseVideo[]) { await this.remote.replaceVideos(id, videos); await this.hydrate(); return clone(selectAdminSnapshot(this.snapshot).videos.filter((item) => item.caseId === id)); }
  async setCaseTags(id: string, tagIds: string[]) { await this.remote.replaceTags(id, tagIds); await this.hydrate(); return clone(selectAdminSnapshot(this.snapshot).caseTagIds[id] ?? []); }
  async publishCase(id: string): Promise<PublishResult> { try { const row = await this.remote.transition("publish_case", id); await this.hydrate(); return { ok: true, case: mapPortfolioCaseRow(row) }; } catch (error) { if (error instanceof Error && error.message.includes("conflict")) throw error; return { ok: false, issues: [{ code: "privacy-checklist-incomplete", message: "공개 조건을 다시 확인해 주세요." }] }; } }
  async unpublishCase(id: string): Promise<PortfolioCase> { const row = await this.remote.transition("unpublish_case", id); await this.hydrate(); return mapPortfolioCaseRow(row); }
  async softDeleteCase(id: string) { await this.remote.transition("soft_delete_case", id); await this.hydrate(); }
  async discardDraft(id: string) { if (!this.remote.discardDraft) throw new Error("초안 작업을 지원하지 않습니다."); await this.remote.discardDraft(id); await this.hydrate(); }
  async restoreHistory(id: string, historyId: string) { if (!this.remote.restoreHistory) throw new Error("이력 복원을 지원하지 않습니다."); await this.remote.restoreHistory(id, historyId); await this.hydrate(); }
  async restoreDeleted(id: string) { if (!this.remote.restoreDeleted) throw new Error("휴지통 복원을 지원하지 않습니다."); await this.remote.restoreDeleted(id); await this.hydrate(); }
  async saveTag(tag: Tag) { if (!this.remote.saveTag) throw new Error("태그 저장을 지원하지 않습니다."); await this.remote.saveTag(tag); await this.hydrate(); }
  async resetToSeed() { throw new Error("운영 데이터는 목업 시드로 초기화할 수 없습니다."); }
  private emit() { this.listeners.forEach((listener) => listener()); }
}
