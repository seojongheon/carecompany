import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeContent, resolveContentImages } from "../repository/supabase-site-content-repository";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";

export const getPublishedContent = cache(async () => {
  const client = await createServerSupabaseClient();
  const result = await client.rpc("get_published_site_content");
  if (result.error) throw new Error("공개 콘텐츠를 불러오지 못했습니다.");
  const content = normalizeContent(result.data);
  await resolveContentImages(content as unknown as Record<string,unknown>,client);
  return content;
});
export const getPublishedServices = cache(async () => {
  const content = await getPublishedContent();
  return (content.services ?? []).map((service) => ({ ...SEED_SNAPSHOT.services.find((item) => item.key===service.key)!, ...service }));
});
