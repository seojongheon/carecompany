import { test as base, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

type CaseFixture = { id: string; slug: string; title: string };
const required = ["E2E_BASE_URL", "E2E_SUPABASE_URL", "E2E_SUPABASE_ANON_KEY", "E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD"] as const;
const targetAuthorized = process.env.E2E_TARGET_ENV === "staging" && process.env.E2E_ALLOW_STAGING_WRITES === "true"
  || process.env.E2E_TARGET_ENV === "linked" && process.env.E2E_ALLOW_LINKED_WRITES === "true";
// Retain the existing export for callers of the separate operations configuration.
export const stagingReady = targetAuthorized && required.every(key => Boolean(process.env[key]));
export const stagingSkipReason = "Requires explicit E2E_BASE_URL, E2E_SUPABASE_URL/ANON_KEY and E2E_ADMIN_EMAIL/PASSWORD, plus either E2E_TARGET_ENV=staging with E2E_ALLOW_STAGING_WRITES=true, or E2E_TARGET_ENV=linked with E2E_ALLOW_LINKED_WRITES=true. App .env credentials are never imported.";

export async function signIn(page: Page, role: "ADMIN" | "CUSTOMER" | "SUPER_ADMIN" | "SUSPENDED" = "ADMIN") {
  const email = process.env[`E2E_${role}_EMAIL`]; const password = process.env[`E2E_${role}_PASSWORD`];
  if (!email || !password) throw new Error(`Missing explicit ${role} test credentials`);
  await page.goto(role === "CUSTOMER" ? "/login" : "/admin/login");
  await page.getByLabel(role === "CUSTOMER" ? "이메일" : "관리자 이메일", { exact: true }).fill(email);
  await page.getByLabel(role === "CUSTOMER" ? "비밀번호" : "관리자 비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  if (role !== "SUSPENDED") await expect(page).toHaveURL(/\/$/);
}

export const test = base.extend<{
  staffClient: SupabaseClient;
  createCase: (title?: string) => Promise<CaseFixture>;
}>({
  page: async ({ page }, provide) => {
    const allowed = process.env.E2E_SUPABASE_URL ? new URL(process.env.E2E_SUPABASE_URL).origin : "";
    let mismatch = false;
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      const backendRequest = ["/auth/v1/", "/rest/v1/", "/storage/v1/"].some(prefix => url.pathname.startsWith(prefix));
      if (backendRequest && url.origin !== allowed) { mismatch = true; return route.abort("blockedbyclient"); }
      return route.continue();
    });
    await provide(page);
    expect(mismatch, "The application attempted to use a backend other than the explicitly declared test Supabase").toBe(false);
  },
  staffClient: async ({ baseURL }, provide) => {
    if (!stagingReady || baseURL !== process.env.E2E_BASE_URL) throw new Error(stagingSkipReason);
    const client = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.auth.signInWithPassword({ email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! });
    if (error) throw new Error("Explicit test staff authentication failed");
    await provide(client);
    await client.auth.signOut({ scope: "local" });
  },
  createCase: async ({ page, staffClient }, provide) => {
    const created: string[] = [];
    await provide(async (requestedTitle?: string) => {
      const title = requestedTitle ?? `E2E 사례 ${randomUUID()}`;
      await page.goto("/admin/portfolio/new");
      await page.getByLabel("사례 제목", { exact: true }).fill(title);
      await page.getByLabel("서비스", { exact: true }).selectOption({ label: "화장실 청소" });
      await page.getByLabel("표시 지역", { exact: true }).fill("천안 테스트 지역");
      await page.getByRole("button", { name: "비공개 초안 만들기" }).click();
      await expect(page.getByText("비공개 초안을 만들었습니다. 사례 목록에서 계속 편집할 수 있습니다.")).toBeVisible();
      const { data, error } = await staffClient.from("portfolio_cases").select("id,slug,title").eq("title", title).single();
      if (error || !data) throw new Error("Staging case created in UI was not found on the declared test backend");
      created.push(String(data.id));
      return data as CaseFixture;
    });
    // No permanent deletes. Only cases created by this test are moved to trash.
    for (const id of created) {
      const { data, error } = await staffClient.from("portfolio_cases").select("revision,status").eq("id", id).single();
      if (error) throw new Error("Could not read test case for cleanup");
      if (data && data.status !== "deleted") {
        const result = await staffClient.rpc("transition_case_revision", { case_id: id, expected_revision: data.revision, operation: "trash" });
        if (result.error) throw new Error(`Could not move test case ${id} to trash`);
      }
    }
  },
});
export { expect };
