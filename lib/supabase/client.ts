"use client";

import {
  createBrowserClient,
  memoryLocalStorageAdapter,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsBrowser,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readPublicSupabaseEnv } from "./env";

type BrowserFactory<T> = (
  url: string,
  publishableKey: string,
  options: {
    auth: {
      userStorage: {
        getItem(key: string): string | null;
        setItem(key: string, value: string): void;
        removeItem(key: string): void;
      };
    };
    cookies: CookieMethodsBrowser;
  },
) => T;

const browserCookieMethods: CookieMethodsBrowser = {
  encode: "tokens-only",
  getAll() {
    return typeof document === "undefined" ? [] : parseCookieHeader(document.cookie);
  },
  setAll(cookiesToSet) {
    if (typeof document === "undefined") return;
    for (const { name, value, options } of cookiesToSet) {
      document.cookie = serializeCookieHeader(name, value, options);
    }
  },
};

const browserUserStorage = typeof window === "undefined"
  ? memoryLocalStorageAdapter()
  : window.localStorage;

export function createBrowserSupabaseClient<T = SupabaseClient>(
  factory: BrowserFactory<T> = createBrowserClient as unknown as BrowserFactory<T>,
  source: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED,
  },
): T {
  const environment = readPublicSupabaseEnv(source);
  return factory(environment.url, environment.publishableKey, {
    auth: { userStorage: browserUserStorage },
    cookies: browserCookieMethods,
  });
}
