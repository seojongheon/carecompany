import type {
  AdminCaseDetail,
  AdminCaseFilter,
  AdminCaseSummary,
  MockStoreEnvelope,
  PortfolioCardView,
  PortfolioPage,
  PortfolioQuery,
  PublicCaseDetail,
} from "../model/types";
import { decodePortfolioCursor, encodePortfolioCursor } from "../model/cursor";

function customerReady(store: MockStoreEnvelope, caseId: string) {
  return store.media.some(
    (item) => item.caseId === caseId && item.public && item.uploadStatus === "ready" && item.cover,
  );
}

function comparePublicCases(a: MockStoreEnvelope["cases"][number], b: MockStoreEnvelope["cases"][number]) {
  if (a.featuredRank !== null || b.featuredRank !== null) {
    if (a.featuredRank === null) return 1;
    if (b.featuredRank === null) return -1;
    if (a.featuredRank !== b.featuredRank) return a.featuredRank - b.featuredRank;
  }
  const publishedOrder = (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  return publishedOrder || a.id.localeCompare(b.id);
}

function cursorFor(item: MockStoreEnvelope["cases"][number]) {
  return encodePortfolioCursor({
    featuredRank: item.featuredRank,
    publishedAt: item.publishedAt,
    id: item.id,
  });
}

function toCard(store: MockStoreEnvelope, portfolioCase: MockStoreEnvelope["cases"][number]): PortfolioCardView {
  const publicMedia = store.media
    .filter((item) => item.caseId === portfolioCase.id && item.public && item.uploadStatus === "ready")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const service = store.services.find(({ id }) => id === portfolioCase.serviceId)!;
  const tagIds = store.caseTagIds[portfolioCase.id] ?? [];
  return {
    ...portfolioCase,
    service,
    coverMedia: publicMedia.find(({ cover }) => cover) ?? publicMedia[0],
    publicMediaCount: publicMedia.length,
    tags: store.tags.filter((tag) => tagIds.includes(tag.id) && tag.active),
  };
}

export function selectPublicCases(store: MockStoreEnvelope, query: PortfolioQuery): PortfolioPage {
  const serviceByKey = query.serviceKey
    ? store.services.find(({ key }) => key === query.serviceKey)
    : undefined;
  const requestedTags = new Set(query.tagKeys ?? []);
  const filtered = store.cases
    .filter((item) => item.status === "published" && customerReady(store, item.id))
    .filter((item) => !query.serviceKey || item.serviceId === serviceByKey?.id)
    .filter((item) => {
      if (requestedTags.size === 0) return true;
      const keys = new Set(
        store.tags
          .filter((tag) => (store.caseTagIds[item.id] ?? []).includes(tag.id))
          .map(({ key }) => key),
      );
      return [...requestedTags].every((key) => keys.has(key));
    })
    .sort(comparePublicCases);

  const decodedCursor = query.cursor ? decodePortfolioCursor(query.cursor) : null;
  const start = decodedCursor
    ? Math.max(0, filtered.findIndex((item) => item.id === decodedCursor.id && cursorFor(item) === query.cursor) + 1)
    : 0;
  const selected = filtered.slice(start, start + query.limit);
  const hasMore = start + selected.length < filtered.length;

  return {
    items: selected.map((item) => toCard(store, item)),
    nextCursor: hasMore && selected.length ? cursorFor(selected[selected.length - 1]) : null,
    totalPublic: filtered.length,
  };
}

export function selectPublicCaseBySlug(store: MockStoreEnvelope, slug: string): PublicCaseDetail | null {
  const portfolioCase = store.cases.find((item) => item.slug === slug);
  if (!portfolioCase || portfolioCase.status !== "published" || !customerReady(store, portfolioCase.id)) {
    return null;
  }
  const card = toCard(store, portfolioCase);
  return {
    ...card,
    media: store.media
      .filter((item) => item.caseId === portfolioCase.id && item.public && item.uploadStatus === "ready")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    videos: store.videos
      .filter((item) => item.caseId === portfolioCase.id && item.public)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
  };
}

export function selectRelatedPublicCases(store: MockStoreEnvelope, caseId: string, limit: number) {
  const source = store.cases.find(({ id }) => id === caseId);
  if (!source) return [];
  return selectPublicCases({ ...store, cases: store.cases.filter(({ id }) => id !== caseId) }, { limit: 100 })
    .items.sort((a, b) => Number(b.serviceId === source.serviceId) - Number(a.serviceId === source.serviceId))
    .slice(0, limit);
}

export function selectAdminCases(store: MockStoreEnvelope, filter: AdminCaseFilter): AdminCaseSummary[] {
  const service = filter.serviceKey ? store.services.find(({ key }) => key === filter.serviceKey) : undefined;
  return store.cases
    .filter((item) => filter.status === "all" || !filter.status || item.status === filter.status)
    .filter((item) => !filter.serviceKey || item.serviceId === service?.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
    .map((item) => ({
      ...item,
      service: store.services.find(({ id }) => id === item.serviceId)!,
      mediaCount: store.media.filter(({ caseId }) => caseId === item.id).length,
    }));
}

export function selectAdminCaseById(store: MockStoreEnvelope, id: string): AdminCaseDetail | null {
  const portfolioCase = store.cases.find((item) => item.id === id);
  if (!portfolioCase) return null;
  const tagIds = store.caseTagIds[id] ?? [];
  return {
    ...portfolioCase,
    service: store.services.find((service) => service.id === portfolioCase.serviceId)!,
    media: store.media.filter(({ caseId }) => caseId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    videos: store.videos.filter(({ caseId }) => caseId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    tags: store.tags.filter(({ id: tagId }) => tagIds.includes(tagId)),
  };
}
