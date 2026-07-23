"use client";

import { createContext, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SEED_SNAPSHOT } from "../data/seed";
import type {
  CaseMedia,
  CaseVideo,
  CreateDraftInput,
  MockStoreEnvelope,
  PublishResult,
  UpdateCaseInput,
} from "../model/types";
import { LocalStoragePortfolioRepository } from "./local-storage-portfolio-repository";
import type { PortfolioRepository } from "./portfolio-repository";
import { SupabasePortfolioGateway, SupabasePortfolioRepository } from "./supabase-portfolio-repository";

export type MutationState = "idle" | "saving" | "saved" | "failed";

interface MutationStatus {
  state: MutationState;
  message: string | null;
}

export interface PortfolioContextValue {
  snapshot: MockStoreEnvelope;
  repository: PortfolioRepository;
  mutation: MutationStatus;
  recoveryNotice: string | null;
  dismissRecoveryNotice: () => void;
  createDraft: (input: CreateDraftInput) => Promise<Awaited<ReturnType<PortfolioRepository["createDraft"]>> | undefined>;
  updateCase: (id: string, patch: UpdateCaseInput) => Promise<Awaited<ReturnType<PortfolioRepository["updateCase"]>> | undefined>;
  setCaseMedia: (id: string, media: CaseMedia[]) => Promise<CaseMedia[] | undefined>;
  setCaseVideos: (id: string, videos: CaseVideo[]) => Promise<CaseVideo[] | undefined>;
  setCaseTags: (id: string, tagIds: string[]) => Promise<string[] | undefined>;
  publishCase: (id: string) => Promise<PublishResult | undefined>;
  unpublishCase: (id: string) => Promise<Awaited<ReturnType<PortfolioRepository["unpublishCase"]>> | undefined>;
  softDeleteCase: (id: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextValue | null>(null);
function defaultRepository() {
  const client = createBrowserSupabaseClient();
  return new SupabasePortfolioRepository(new SupabasePortfolioGateway(client));
}

function createReactStore(repository: PortfolioRepository) {
  let current = repository.getSnapshot();
  const serverSnapshot = repository instanceof LocalStoragePortfolioRepository
    ? structuredClone(SEED_SNAPSHOT) as MockStoreEnvelope
    : current;
  const reactListeners = new Set<() => void>();
  let unsubscribeRepository: (() => void) | null = null;
  const onRepositoryChange = () => {
    current = repository.getSnapshot();
    reactListeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => current,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      reactListeners.add(listener);
      unsubscribeRepository ??= repository.subscribe(onRepositoryChange);
      return () => {
        reactListeners.delete(listener);
        if (reactListeners.size === 0) {
          unsubscribeRepository?.();
          unsubscribeRepository = null;
        }
      };
    },
    refresh() {
      current = repository.getSnapshot();
      reactListeners.forEach((listener) => listener());
    },
  };
}

export function PortfolioProvider({
  children,
  repository: repositoryProp,
}: Readonly<{
  children: React.ReactNode;
  repository?: PortfolioRepository;
}>) {
  const repository = useMemo(() => repositoryProp ?? defaultRepository(), [repositoryProp]);
  const reactStore = useMemo(() => createReactStore(repository), [repository]);
  useEffect(() => { void repository.hydrate?.().catch(() => reactStore.refresh()); }, [reactStore, repository]);
  const snapshot = useSyncExternalStore(
    reactStore.subscribe,
    reactStore.getSnapshot,
    reactStore.getServerSnapshot,
  );
  const [mutation, setMutation] = useState<MutationStatus>({ state: "idle", message: null });
  const recoveryStore = useMemo(() => {
    const notice = repository instanceof LocalStoragePortfolioRepository ? repository.consumeRecoveryNotice() : null;
    return {
      getSnapshot: () => notice,
      getServerSnapshot: () => null,
      subscribe: () => () => undefined,
    };
  }, [repository]);
  const initialRecovery = useSyncExternalStore(
    recoveryStore.subscribe,
    recoveryStore.getSnapshot,
    recoveryStore.getServerSnapshot,
  );
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);

  const execute = useCallback(async <T,>(operation: () => T | Promise<T>): Promise<T | undefined> => {
    setMutation({ state: "saving", message: "저장 중입니다." });
    try {
      const result = await operation();
      setMutation({ state: "saved", message: "저장했습니다." });
      return result;
    } catch {
      reactStore.refresh();
      setMutation({ state: "failed", message: "저장에 실패했습니다. 권한과 입력 내용을 확인해 주세요." });
      return undefined;
    }
  }, [reactStore]);

  const createDraft = useCallback((input: CreateDraftInput) => execute(() => repository.createDraft(input)), [execute, repository]);
  const updateCase = useCallback((id: string, patch: UpdateCaseInput) => execute(() => repository.updateCase(id, patch)), [execute, repository]);
  const setCaseMedia = useCallback((id: string, media: CaseMedia[]) => execute(() => repository.setCaseMedia(id, media)), [execute, repository]);
  const setCaseVideos = useCallback((id: string, videos: CaseVideo[]) => execute(() => repository.setCaseVideos(id, videos)), [execute, repository]);
  const setCaseTags = useCallback((id: string, tagIds: string[]) => execute(() => repository.setCaseTags(id, tagIds)), [execute, repository]);
  const publishCase = useCallback((id: string) => execute(() => repository.publishCase(id)), [execute, repository]);
  const unpublishCase = useCallback((id: string) => execute(() => repository.unpublishCase(id)), [execute, repository]);
  const softDeleteCase = useCallback(async (id: string) => { await execute(() => repository.softDeleteCase(id)); }, [execute, repository]);
  const resetToSeed = useCallback(async () => { await execute(() => repository.resetToSeed()); }, [execute, repository]);

  const value = useMemo<PortfolioContextValue>(() => ({
    snapshot,
    repository,
    mutation,
    recoveryNotice: recoveryDismissed ? null : initialRecovery,
    dismissRecoveryNotice: () => setRecoveryDismissed(true),
    createDraft,
    updateCase,
    setCaseMedia,
    setCaseVideos,
    setCaseTags,
    publishCase,
    unpublishCase,
    softDeleteCase,
    resetToSeed,
  }), [createDraft, initialRecovery, mutation, publishCase, recoveryDismissed, repository, resetToSeed, setCaseMedia, setCaseTags, setCaseVideos, snapshot, softDeleteCase, unpublishCase, updateCase]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
