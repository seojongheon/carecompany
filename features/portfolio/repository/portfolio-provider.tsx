"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SEED_SNAPSHOT } from "../data/seed";
import type {
  CaseMedia,
  CaseVideo,
  CreateDraftInput,
  MockStoreEnvelope,
  PortfolioCase,
  PublishResult,
  UpdateCaseInput,
} from "../model/types";
import { LocalStoragePortfolioRepository } from "./local-storage-portfolio-repository";
import type { PortfolioRepository } from "./portfolio-repository";
import { SupabasePortfolioGateway, SupabasePortfolioRepository } from "./supabase-portfolio-repository";

export type MutationState = "idle" | "saving" | "saved" | "failed";
type QueuedUpdate<Input, Current = Input> = Input | ((current: Current) => Input);

interface MutationStatus {
  state: MutationState;
  message: string | null;
}

export interface PortfolioContextValue {
  snapshot: MockStoreEnvelope;
  repository: PortfolioRepository;
  mutation: MutationStatus;
  clearMutationError: () => void;
  recoveryNotice: string | null;
  dismissRecoveryNotice: () => void;
  createDraft: (input: CreateDraftInput) => Promise<Awaited<ReturnType<PortfolioRepository["createDraft"]>> | undefined>;
  updateCase: (id: string, patch: QueuedUpdate<UpdateCaseInput, PortfolioCase>) => Promise<Awaited<ReturnType<PortfolioRepository["updateCase"]>> | undefined>;
  setCaseMedia: (id: string, media: QueuedUpdate<CaseMedia[]>) => Promise<CaseMedia[] | undefined>;
  appendCaseMedia: (id: string, media: CaseMedia) => Promise<CaseMedia[] | undefined>;
  setCaseVideos: (id: string, videos: QueuedUpdate<CaseVideo[]>) => Promise<CaseVideo[] | undefined>;
  setCaseTags: (id: string, tagIds: QueuedUpdate<string[]>) => Promise<string[] | undefined>;
  publishCase: (id: string) => Promise<PublishResult | undefined>;
  unpublishCase: (id: string) => Promise<Awaited<ReturnType<PortfolioRepository["unpublishCase"]>> | undefined>;
  softDeleteCase: (id: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
  loadError: string | null;
  loading: boolean;
  reload: () => Promise<boolean>;
  discardDraft: (id: string) => Promise<boolean>;
  restoreHistory: (id: string, historyId: string) => Promise<boolean>;
  restoreDeleted: (id: string) => Promise<boolean>;
  saveTag: (tag: import("../model/types").Tag) => Promise<boolean>;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(repository.hydrate));
  const reload = useCallback(async () => {
    if (!repository.hydrate) return true;
    setLoading(true); setLoadError(null);
    try { await repository.hydrate(); return true; } catch { setLoadError("사례를 불러오지 못했습니다. 다시 시도해 주세요."); return false; }
    finally { setLoading(false); }
  }, [repository]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) void reload(); }); return () => { active = false; }; }, [reload]);
  useEffect(() => {
    if (repositoryProp) return;
    const { data: { subscription } } = createBrowserSupabaseClient().auth.onAuthStateChange(() => { queueMicrotask(() => { void reload(); }); });
    return () => subscription.unsubscribe();
  }, [reload, repositoryProp]);
  const snapshot = useSyncExternalStore(
    reactStore.subscribe,
    reactStore.getSnapshot,
    reactStore.getServerSnapshot,
  );
  const [mutation, setMutation] = useState<MutationStatus>({ state: "idle", message: null });
  const clearMutationError = useCallback(() => {
    setMutation(current => current.state === "failed" ? { state: "idle", message: null } : current);
  }, []);
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

  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const execute = useCallback(async <T,>(operation: () => T | Promise<T>): Promise<T | undefined> => {
    const previous = pending.current;
    let finish!: () => void;
    pending.current = new Promise<void>((resolve) => { finish = resolve; });
    await previous;
    setMutation({ state: "saving", message: "저장 중입니다." });
    try {
      const result = await operation();
      setMutation({ state: "saved", message: "저장했습니다." });
      return result;
    } catch (error) {
      reactStore.refresh();
      setMutation({ state: "failed", message: error instanceof Error && error.message.includes("conflict") ? "다른 관리자가 먼저 저장했습니다. 입력 내용을 복사한 뒤 최신 버전을 다시 불러와 비교해 주세요." : "저장에 실패했습니다. 입력은 유지됩니다. 권한과 내용을 확인하고 다시 저장해 주세요." });
      return undefined;
    } finally { finish(); }
  }, [reactStore]);

  const currentCase = useCallback((id: string) => {
    const current = repository.getAdminCaseById(id);
    if (!current) throw new Error("사례를 찾을 수 없습니다.");
    return current;
  }, [repository]);
  const createDraft = useCallback((input: CreateDraftInput) => execute(() => repository.createDraft(input)), [execute, repository]);
  // Resolve functional edits only after earlier saves and their hydration have completed.
  const updateCase = useCallback((id: string, patch: QueuedUpdate<UpdateCaseInput, PortfolioCase>) => execute(() => repository.updateCase(id, typeof patch === "function" ? patch(currentCase(id)) : patch)), [execute, repository, currentCase]);
  const setCaseMedia = useCallback((id: string, media: QueuedUpdate<CaseMedia[]>) => execute(() => repository.setCaseMedia(id, typeof media === "function" ? media(currentCase(id).media) : media)), [execute, repository, currentCase]);
  const appendCaseMedia = useCallback((id: string, media: CaseMedia) => execute(() => repository.setCaseMedia(id, [...(repository.getAdminCaseById(id)?.media ?? []).filter(item => item.id !== media.id), media])), [execute, repository]);
  const setCaseVideos = useCallback((id: string, videos: QueuedUpdate<CaseVideo[]>) => execute(() => repository.setCaseVideos(id, typeof videos === "function" ? videos(currentCase(id).videos) : videos)), [execute, repository, currentCase]);
  const setCaseTags = useCallback((id: string, tagIds: QueuedUpdate<string[]>) => execute(() => repository.setCaseTags(id, typeof tagIds === "function" ? tagIds(currentCase(id).tags.map(tag => tag.id)) : tagIds)), [execute, repository, currentCase]);
  const publishCase = useCallback((id: string) => execute(() => repository.publishCase(id)), [execute, repository]);
  const unpublishCase = useCallback((id: string) => execute(() => repository.unpublishCase(id)), [execute, repository]);
  const softDeleteCase = useCallback(async (id: string) => { await execute(() => repository.softDeleteCase(id)); }, [execute, repository]);
  const resetToSeed = useCallback(async () => { await execute(() => repository.resetToSeed()); }, [execute, repository]);

  const discardDraft = useCallback(async (id: string) => Boolean(await execute(async () => { if (!repository.discardDraft) throw new Error("미지원"); await repository.discardDraft(id); return true; })), [execute, repository]);
  const restoreHistory = useCallback(async (id: string, historyId: string) => Boolean(await execute(async () => { if (!repository.restoreHistory) throw new Error("미지원"); await repository.restoreHistory(id, historyId); return true; })), [execute, repository]);
  const restoreDeleted = useCallback(async (id: string) => Boolean(await execute(async () => { if (!repository.restoreDeleted) throw new Error("미지원"); await repository.restoreDeleted(id); return true; })), [execute, repository]);
  const saveTag = useCallback(async (tag: import("../model/types").Tag) => Boolean(await execute(async () => { if (!repository.saveTag) throw new Error("미지원"); await repository.saveTag(tag); return true; })), [execute, repository]);

  const value = useMemo<PortfolioContextValue>(() => ({
    snapshot,
    loadError, loading, reload, discardDraft, restoreHistory, restoreDeleted, saveTag,
    repository,
    mutation,
    clearMutationError,
    recoveryNotice: recoveryDismissed ? null : initialRecovery,
    dismissRecoveryNotice: () => setRecoveryDismissed(true),
    createDraft,
    updateCase,
    setCaseMedia,
    appendCaseMedia,
    setCaseVideos,
    setCaseTags,
    publishCase,
    unpublishCase,
    softDeleteCase,
    resetToSeed,
  }), [loadError, loading, reload, discardDraft, restoreHistory, restoreDeleted, saveTag, createDraft, initialRecovery, mutation, clearMutationError, publishCase, recoveryDismissed, repository, resetToSeed, setCaseMedia, appendCaseMedia, setCaseTags, setCaseVideos, snapshot, softDeleteCase, unpublishCase, updateCase]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
