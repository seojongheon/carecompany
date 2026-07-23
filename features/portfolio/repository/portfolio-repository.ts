import type {
  AdminCaseDetail,
  AdminCaseFilter,
  AdminCaseSummary,
  CaseMedia,
  CaseVideo,
  CreateDraftInput,
  MockStoreEnvelope,
  PortfolioCase,
  PortfolioPage,
  PortfolioQuery,
  PublicCaseDetail,
  PublishResult,
  Service,
  UpdateCaseInput,
} from "../model/types";

export interface PortfolioRepository {
  hydrate?(): Promise<void>;
  getSnapshot(): MockStoreEnvelope;
  subscribe(listener: () => void): () => void;
  listServices(): Service[];
  listPublicCases(query: PortfolioQuery): PortfolioPage;
  getPublicCaseBySlug(slug: string): PublicCaseDetail | null;
  listRelatedPublicCases(caseId: string, limit: number): PortfolioPage["items"];
  listAdminCases(filter: AdminCaseFilter): AdminCaseSummary[];
  getAdminCaseById(id: string): AdminCaseDetail | null;
  createDraft(input: CreateDraftInput): PortfolioCase | Promise<PortfolioCase>;
  updateCase(id: string, patch: UpdateCaseInput): PortfolioCase | Promise<PortfolioCase>;
  setCaseMedia(id: string, media: CaseMedia[]): CaseMedia[] | Promise<CaseMedia[]>;
  setCaseVideos(id: string, videos: CaseVideo[]): CaseVideo[] | Promise<CaseVideo[]>;
  setCaseTags(id: string, tagIds: string[]): string[] | Promise<string[]>;
  publishCase(id: string): PublishResult | Promise<PublishResult>;
  unpublishCase(id: string): PortfolioCase | Promise<PortfolioCase>;
  softDeleteCase(id: string): void | Promise<void>;
  resetToSeed(): void | Promise<void>;
}
