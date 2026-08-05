"use client";

import { useEffect, useMemo, useState } from "react";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { CaseMedia, ServiceKey } from "@/features/portfolio/model/types";
import { isSupabaseStorageAllowed } from "@/features/uploads/model/upload-runtime";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const SIGNED_URL_TTL_SECONDS = 60 * 30;

export function useCaseMediaUrls(media: CaseMedia[], developmentFallbackKey?: ServiceKey) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const storageAllowed = isSupabaseStorageAllowed(
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true",
    process.env.NODE_ENV,
  );
  const signature = storageAllowed ? media
    .filter((item) => item.storagePath)
    .map((item) => `${item.id}:${item.storagePath}`)
    .join("|") : "";
  const developmentUrls = storageAllowed ? {} : Object.fromEntries(
    media.flatMap((item) => {
      const fallback = MOCK_ASSETS[item.mockAssetKey || developmentFallbackKey || ""];
      return fallback ? [[item.id, fallback]] : [];
    }),
  );
  const request = useMemo(() => signature
    ? signature.split("|").map((entry) => {
      const separator = entry.indexOf(":");
      return { id: entry.slice(0, separator), path: entry.slice(separator + 1) };
    })
    : [], [signature]);

  useEffect(() => {
    if (!request.length) {
      return;
    }
    let active = true;
    void createBrowserSupabaseClient().storage.from("case-reviewed-public").createSignedUrls(request.map(({ path }) => path), SIGNED_URL_TTL_SECONDS).then(({ data, error }) => {
      if (!active || error || !data) return;
      const next: Record<string, string> = {};
      data.forEach((item, index) => {
        if (item.signedUrl) next[request[index].id] = item.signedUrl;
      });
      setUrls(next);
    });
    return () => { active = false; };
  }, [signature, request]);

  return storageAllowed && request.length ? urls : developmentUrls;
}
