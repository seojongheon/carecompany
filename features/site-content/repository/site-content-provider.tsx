"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, useState, useCallback } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SITE_CONTENT_SEED_SNAPSHOT } from "../model/seed";
import type { PublishContentResult, SiteContent, SiteContentSnapshot } from "../model/types";
import { LocalStorageSiteContentRepository } from "./local-storage-site-content-repository";
import type { SiteContentRepository } from "./site-content-repository";
import { SupabaseSiteContentGateway, SupabaseSiteContentRepository } from "./supabase-site-content-repository";

type Value = {
  snapshot: SiteContentSnapshot;
  loading:boolean; error:string|null; retry:()=>Promise<void>;
  updateDraft: (patch: Partial<SiteContent>) => void;
  saveDraft: () => Promise<boolean>;
  publish: () => Promise<PublishContentResult>;
  restoreVersion: (id: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
};

const Context = createContext<Value | null>(null);
const serverSnapshot = structuredClone(SITE_CONTENT_SEED_SNAPSHOT);

function defaultRepository(): SiteContentRepository {
  const client = createBrowserSupabaseClient();
  return new SupabaseSiteContentRepository(new SupabaseSiteContentGateway(client));
}

export function SiteContentProvider({ children, repository: repositoryProp }: { children: React.ReactNode; repository?: SiteContentRepository }) {
  const repository = useMemo(() => repositoryProp ?? defaultRepository(), [repositoryProp]);
  const [loading,setLoading]=useState(Boolean(repository.hydrate));
  const [error,setError]=useState<string|null>(null);
  const retry=useCallback(async()=>{try{await repository.hydrate?.();setError(null);}catch{setError("공개 콘텐츠를 불러오지 못했습니다.");}finally{setLoading(false);}},[repository]);
  useEffect(() => { queueMicrotask(() => { void retry(); }); }, [retry]);
  const snapshot = useSyncExternalStore(
    repository.subscribe.bind(repository),
    repository.getSnapshot.bind(repository),
    () => repository instanceof LocalStorageSiteContentRepository ? serverSnapshot : repository.getSnapshot(),
  );
  const value = useMemo<Value>(() => ({
    snapshot, loading,error,retry,
    updateDraft: (patch) => repository.updateDraft(patch),
    saveDraft: async () => { try { await repository.saveDraft?.(); return true; } catch { return false; } },
    publish: async () => await repository.publish(),
    restoreVersion: async (id) => { await repository.restoreVersion(id); },
    resetToSeed: async () => { await repository.resetToSeed(); },
  }), [repository, snapshot, loading, error, retry]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

const fallbackValue: Value = {
  snapshot: structuredClone(SITE_CONTENT_SEED_SNAPSHOT),
  loading:false,error:null,retry:async()=>undefined,
  updateDraft: () => undefined,
  saveDraft: async () => false,
  publish: async () => ({ ok: false, issues: ["콘텐츠 저장소를 사용할 수 없습니다."] }),
  restoreVersion: async () => undefined,
  resetToSeed: async () => undefined,
};

export function useSiteContent() { return useContext(Context) ?? fallbackValue; }
