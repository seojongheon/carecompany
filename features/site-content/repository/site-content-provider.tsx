"use client";
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { LocalStorageSiteContentRepository } from "./local-storage-site-content-repository";
import { SITE_CONTENT_SEED_SNAPSHOT } from "../model/seed";
import type { SiteContent } from "../model/types";

type Value = { snapshot: ReturnType<LocalStorageSiteContentRepository["getSnapshot"]>; updateDraft: (patch: Partial<SiteContent>) => void; publish: () => ReturnType<LocalStorageSiteContentRepository["publish"]>; restoreVersion: (id: string) => void; resetToSeed: () => void; };
const Context = createContext<Value | null>(null);
class MemoryStorage implements Storage { private values = new Map<string, string>(); get length() { return this.values.size; } clear() { this.values.clear(); } getItem(key: string) { return this.values.get(key) ?? null; } key(index: number) { return [...this.values.keys()][index] ?? null; } removeItem(key: string) { this.values.delete(key); } setItem(key: string, value: string) { this.values.set(key, value); } }
const serverSnapshot = structuredClone(SITE_CONTENT_SEED_SNAPSHOT);
function defaultRepository() { return new LocalStorageSiteContentRepository(typeof window === "undefined" ? new MemoryStorage() : window.localStorage); }
export function SiteContentProvider({ children, repository }: { children: React.ReactNode; repository?: LocalStorageSiteContentRepository }) { const repo = useMemo(() => repository ?? defaultRepository(), [repository]); const snapshot = useSyncExternalStore(repo.subscribe.bind(repo), repo.getSnapshot.bind(repo), () => serverSnapshot); const value = useMemo<Value>(() => ({ snapshot, updateDraft: (patch) => repo.updateDraft(patch), publish: () => repo.publish(), restoreVersion: (id) => repo.restoreVersion(id), resetToSeed: () => repo.resetToSeed() }), [repo, snapshot]); return <Context.Provider value={value}>{children}</Context.Provider>; }
const fallbackValue: Value = { snapshot: structuredClone(SITE_CONTENT_SEED_SNAPSHOT), updateDraft: () => undefined, publish: () => ({ ok: true }), restoreVersion: () => undefined, resetToSeed: () => undefined };
export function useSiteContent() { return useContext(Context) ?? fallbackValue; }
