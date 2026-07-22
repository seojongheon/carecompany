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
  getSnapshot(): MockStoreEnvelope;
  subscribe(listener: () => void): () => void;
  listServices(): Service[];
  listPublicCases(query: PortfolioQuery): PortfolioPage;
  getPublicCaseBySlug(slug: string): PublicCaseDetail | null;
  listRelatedPublicCases(caseId: string, limit: number): PortfolioPage["items"];
  listAdminCases(filter: AdminCaseFilter): AdminCaseSummary[];
  getAdminCaseById(id: string): AdminCaseDetail | null;
  createDraft(input: CreateDraftInput): PortfolioCase;
  updateCase(id: string, patch: UpdateCaseInput): PortfolioCase;
  setCaseMedia(id: string, media: CaseMedia[]): CaseMedia[];
  setCaseVideos(id: string, videos: CaseVideo[]): CaseVideo[];
  setCaseTags(id: string, tagIds: string[]): string[];
  publishCase(id: string): PublishResult;
  unpublishCase(id: string): PortfolioCase;
  softDeleteCase(id: string): void;
  resetToSeed(): void;
}
