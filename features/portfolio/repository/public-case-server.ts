import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PublicCaseDetail } from "../model/types";
import {
  mapCaseMediaRow,
  mapCaseVideoRow,
  mapPortfolioCaseRow,
  mapServiceRow,
  mapTagRow,
} from "./supabase-mappers";

type Row = Record<string, unknown>;

interface PublicCaseRpcClient {
  rpc(
    name: "get_public_portfolio_case",
    args: { case_slug: string },
  ): PromiseLike<{ data: unknown; error: { message?: string } | null }>;
}

function record(value: unknown): Row | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Row
    : null;
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(record).filter((item): item is Row => item !== null) : [];
}

export async function readPublicCaseBySlug(
  client: PublicCaseRpcClient,
  slug: string,
): Promise<PublicCaseDetail | null> {
  const { data, error } = await client.rpc("get_public_portfolio_case", { case_slug: slug });
  if (error) throw new Error(error.message || "공개 사례를 불러오지 못했습니다.");

  const payload = record(data);
  const caseRow = record(payload?.case);
  const serviceRow = record(payload?.service);
  if (!payload || !caseRow || !serviceRow) return null;

  const portfolioCase = mapPortfolioCaseRow(caseRow);
  if (portfolioCase.status !== "published") return null;

  const media = rows(payload.media)
    .map(mapCaseMediaRow)
    .filter((item) => item.public && item.uploadStatus === "ready")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const coverMedia = media.find((item) => item.cover);
  if (!coverMedia) return null;

  return {
    ...portfolioCase,
    service: mapServiceRow(serviceRow),
    coverMedia,
    publicMediaCount: media.length,
    media,
    videos: rows(payload.videos)
      .map(mapCaseVideoRow)
      .filter((item) => item.public)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    tags: rows(payload.tags).map(mapTagRow),
  };
}

export const getPublicCaseBySlugFromServer = cache(async (slug: string) => {
  const client = await createServerSupabaseClient();
  return readPublicCaseBySlug(client, slug);
});
