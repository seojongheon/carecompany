"use client";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SupabaseAuthRepository, type AuthProfileRow } from "./supabase-auth-repository";
import type { AuthCredentials, AuthRepository, AuthResult, AuthSession } from "../model/types";

type AuthValue = { session: AuthSession | null; signUpCustomer(input: AuthCredentials): Promise<AuthResult>; signInCustomer(input: AuthCredentials): Promise<AuthResult>; signInAdmin(input: AuthCredentials): Promise<AuthResult>; requestPasswordReset(email: string): Promise<{ ok: true; message: string }>; signOut(): void | Promise<void> };
const Context = createContext<AuthValue | null>(null);
function defaultRepository() {
  const client = createBrowserSupabaseClient();
  return new SupabaseAuthRepository(
    client,
    async (userId): Promise<AuthProfileRow | null> => {
      const { data, error } = await client
        .from("profiles")
        .select("id,email,role,is_active")
        .eq("id", userId)
        .maybeSingle();
      return error ? null : data as AuthProfileRow | null;
    },
  );
}
function reactStore(repository: AuthRepository) { let current = repository.getSession(); return { subscribe(listener: () => void) { return repository.subscribe(() => { current = repository.getSession(); listener(); }); }, getSnapshot: () => current, getServerSnapshot: () => null }; }
export function AuthProvider({ children, repository: repositoryProp }: { children: React.ReactNode; repository?: AuthRepository }) { const repository = useMemo(() => repositoryProp ?? defaultRepository(), [repositoryProp]); useEffect(() => { if (repository instanceof SupabaseAuthRepository) { void repository.initialize(); return () => repository.dispose(); } return undefined; }, [repository]); const store = useMemo(() => reactStore(repository), [repository]); const session = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot); const value = useMemo<AuthValue>(() => ({ session, signUpCustomer: (input) => repository.signUpCustomer(input), signInCustomer: (input) => repository.signInCustomer(input), signInAdmin: (input) => repository.signInAdmin(input), requestPasswordReset: (email) => repository.requestPasswordReset(email), signOut: () => repository.signOut() }), [repository, session]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useOptionalAuth() { return useContext(Context); }
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider가 필요합니다."); return value; }
