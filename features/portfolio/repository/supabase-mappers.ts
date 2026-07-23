import type { CaseMedia, CaseVideo, PortfolioCase, PublishChecklist, Service, ServiceKey, Tag } from "../model/types";

type Row = Record<string, unknown>;

const text = (value: unknown) => typeof value === "string" ? value : "";
const integer = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const boolean = (value: unknown) => value === true;

export function mapServiceRow(row: Row): Service {
  return {
    id: text(row.id),
    key: text(row.key) as ServiceKey,
    name: text(row.name),
    slug: text(row.slug),
    summary: text(row.summary),
    description: text(row.description),
    coverAssetKey: text(row.cover_asset_key),
    sortOrder: integer(row.sort_order),
    active: boolean(row.active),
  };
}

function mapChecklist(value: unknown): PublishChecklist {
  const row = value && typeof value === "object" ? value as Row : {};
  return {
    noIdentifiablePeople: boolean(row.noIdentifiablePeople),
    noVehiclePlates: boolean(row.noVehiclePlates),
    noDetailedAddressOrContact: boolean(row.noDetailedAddressOrContact),
    noPrivateDocumentsOrBelongings: boolean(row.noPrivateDocumentsOrBelongings),
    publicMediaReviewed: boolean(row.publicMediaReviewed),
    requiredMetadataComplete: boolean(row.requiredMetadataComplete),
    hasPublicReadyMedia: boolean(row.hasPublicReadyMedia),
  };
}

export function mapPortfolioCaseRow(row: Row): PortfolioCase {
  return {
    id: text(row.id),
    serviceId: text(row.service_id),
    slug: text(row.slug),
    title: text(row.title),
    summary: text(row.summary),
    locationDisplay: text(row.location_display),
    spaceType: text(row.space_type),
    workDate: text(row.work_date),
    displayPeriod: text(row.display_period),
    problemDescription: text(row.problem_description),
    workDescription: text(row.work_description),
    resultDescription: text(row.result_description),
    seoTitle: row.seo_title == null ? undefined : text(row.seo_title),
    seoDescription: row.seo_description == null ? undefined : text(row.seo_description),
    status: text(row.status) as PortfolioCase["status"],
    featuredRank: typeof row.featured_rank === "number" ? row.featured_rank : null,
    privacyChecklist: mapChecklist(row.privacy_checklist),
    publishedAt: row.published_at == null ? null : text(row.published_at),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

export function mapCaseMediaRow(row: Row): CaseMedia {
  return {
    id: text(row.id),
    caseId: text(row.case_id),
    stage: text(row.stage) as CaseMedia["stage"],
    sortOrder: integer(row.sort_order),
    cover: boolean(row.is_cover),
    public: boolean(row.is_public),
    altText: text(row.alt_text),
    caption: text(row.caption),
    width: integer(row.width),
    height: integer(row.height),
    mimeType: text(row.mime_type) as CaseMedia["mimeType"],
    sizeBytes: integer(row.size_bytes),
    uploadStatus: text(row.upload_status) as CaseMedia["uploadStatus"],
    mockAssetKey: text(row.mock_asset_key),
    sessionPreviewId: null,
  };
}

export function mapCaseVideoRow(row: Row): CaseVideo {
  return {
    id: text(row.id),
    caseId: text(row.case_id),
    youtubeVideoId: text(row.youtube_video_id),
    originalUrl: text(row.original_url),
    title: text(row.title),
    caption: text(row.caption),
    sortOrder: integer(row.sort_order),
    public: boolean(row.is_public),
  };
}

export function mapTagRow(row: Row): Tag {
  return {
    id: text(row.id),
    serviceId: text(row.service_id),
    key: text(row.key),
    name: text(row.name),
    type: text(row.type) as Tag["type"],
    sortOrder: integer(row.sort_order),
    active: boolean(row.active),
  };
}
