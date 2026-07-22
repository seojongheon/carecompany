"use client";
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { BrowserAuthRepository } from "./browser-auth-repository";
import type { AuthCredentials, AuthRepository, AuthResult, AuthSession } from "../model/types";

type AuthValue = { session: AuthSession | null; signUpCustomer(input: AuthCredentials): Promise<AuthResult>; signInCustomer(input: AuthCredentials): Promise<AuthResult>; signInAdmin(input: AuthCredentials): Promise<AuthResult>; requestPasswordReset(email: string): Promise<{ ok: true; message: string }>; signOut(): void };
const Context = createContext<AuthValue | null>(null);
class MemoryStorage implements Storage { private values = new Map<string, string>(); get length() { return this.values.size; } clear() { this.values.clear(); } getItem(key: string) { return this.values.get(key) ?? null; } key(index: number) { return [...this.values.keys()][index] ?? null; } removeItem(key: string) { this.values.delete(key); } setItem(key: string, value: string) { this.values.set(key, value); } }
function defaultRepository() { return new BrowserAuthRepository(typeof window === "undefined" ? new MemoryStorage() : window.localStorage); }
function reactStore(repository: AuthRepository) { let current = repository.getSession(); return { subscribe(listener: () => void) { return repository.subscribe(() => { current = repository.getSession(); listener(); }); }, getSnapshot: () => current, getServerSnapshot: () => null }; }
export function AuthProvider({ children, repository: repositoryProp }: { children: React.ReactNode; repository?: AuthRepository }) { const repository = useMemo(() => repositoryProp ?? defaultRepository(), [repositoryProp]); const store = useMemo(() => reactStore(repository), [repository]); const session = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot); const value = useMemo<AuthValue>(() => ({ session, signUpCustomer: (input) => repository.signUpCustomer(input), signInCustomer: (input) => repository.signInCustomer(input), signInAdmin: (input) => repository.signInAdmin(input), requestPasswordReset: (email) => repository.requestPasswordReset(email), signOut: () => repository.signOut() }), [repository, session]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useOptionalAuth() { return useContext(Context); }
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider가 필요합니다."); return value; }
