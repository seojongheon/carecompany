import { randomInt, randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { test, expect, signIn, stagingReady, stagingSkipReason } from "./admin-fixtures";

test.skip(!stagingReady, stagingSkipReason);

type TestInquiry = { id: string; receipt_number: string; name: string; updated_at: string };
const testName = () => `E2E-${randomUUID()}`;

async function publishedConsentReady(client: SupabaseClient) {
  const policy = await client.from("content_documents").select("published").eq("key", "policy").maybeSingle();
  expect(policy.error, "Read the existing consent policy without modifying any shared document").toBeNull();
  return policy.data?.published?.reviewed === true && Boolean(String(policy.data?.published?.inquiryConsent ?? "").trim());
}

async function expectConsentBlocked(page: Page) {
  await page.goto("/inquiry");
  await expect(page.getByRole("button", { name: "문의 접수", exact: true })).toBeDisabled();
  await expect(page.locator('input[name="consent"]')).toBeDisabled();
  await expect(page.getByText("개인정보 수집·이용 안내를 준비 중입니다. 게시가 완료되면 문의를 접수할 수 있습니다.", { exact: true })).toBeVisible();
}

async function submitPublicInquiry(page: Page, client: SupabaseClient, name: string) {
  await page.goto("/inquiry");
  await page.getByLabel("이름", { exact: true }).fill(name);
  await page.getByLabel("전화번호", { exact: true }).fill(`0100000${randomInt(1000, 10000)}`);
  await page.getByLabel("서비스", { exact: true }).selectOption("bathroom");
  await page.getByLabel("지역", { exact: true }).fill("E2E 테스트 지역");
  await page.getByLabel("문의 내용").fill(`${name} 테스트 문의입니다. 실제 상담이나 연락은 필요하지 않습니다.`);
  const consent = page.locator('input[name="consent"]');
  await expect(consent).toBeEnabled();
  await consent.check();
  const response = page.waitForResponse(result => new URL(result.url()).pathname === "/api/inquiries" && result.request().method() === "POST");
  await page.getByRole("button", { name: "문의 접수", exact: true }).click();
  const submitted = await response;
  expect(submitted.ok(), "Inquiry submission must succeed against the explicit backend without changing shared policy").toBe(true);
  const receipt = await submitted.json() as { receiptNumber: string };
  await expect(page.getByRole("heading", { name: "문의가 접수되었습니다" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: receipt.receiptNumber })).toContainText(receipt.receiptNumber);
  const result = await client.from("inquiries").select("id,receipt_number,name,updated_at").eq("name", name).single();
  expect(result.error).toBeNull();
  expect(result.data?.receipt_number).toBe(receipt.receiptNumber);
  return result.data as TestInquiry;
}

async function processInquiry(page: Page, client: SupabaseClient, item: TestInquiry, note: string) {
  await page.goto(`/admin/inquiries/${item.id}`);
  await expect(page.getByRole("heading", { level: 1, name: `${item.name}님의 문의`, exact: true })).toBeVisible();
  const actor = await client.auth.getUser();
  expect(actor.data.user?.id).toBeTruthy();
  await page.getByLabel("담당자", { exact: true }).selectOption(actor.data.user!.id);
  await page.getByLabel("처리 상태", { exact: true }).selectOption("consulting");
  await page.getByRole("button", { name: "상태·담당자 저장", exact: true }).click();
  await expect.poll(async () => {
    const result = await client.from("inquiries").select("status,assignee_id").eq("id", item.id).single();
    return result.data;
  }).toEqual({ status: "consulting", assignee_id: actor.data.user!.id });
  // Re-read the server revision before the second optimistic update.
  await page.reload();
  await page.getByLabel("새 메모", { exact: true }).fill(note);
  await page.getByRole("button", { name: "메모 저장", exact: true }).click();
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await page.getByLabel("처리 상태", { exact: true }).selectOption("completed");
  await page.getByRole("button", { name: "상태·담당자 저장", exact: true }).click();
  await expect.poll(async () => (await client.from("inquiries").select("status").eq("id", item.id).single()).data?.status).toBe("completed");
}

async function closeTestInquiries(client: SupabaseClient, name: string) {
  if (!/^E2E-[0-9a-f-]{36}$/.test(name)) throw new Error("Cleanup is restricted to this test's UUID-prefixed records");
  const result = await client.from("inquiries").select("id,name,updated_at").eq("name", name);
  expect(result.error).toBeNull();
  for (const item of result.data ?? []) {
    const update = await client.rpc("admin_update_inquiry", { p_id: item.id, p_status: "completed", p_assignee: null, p_expected_updated_at: item.updated_at });
    expect(update.error, "Synthetic inquiries must finish closed and unassigned; no hard deletion").toBeNull();
  }
}

async function hideTestAnnouncement(client: SupabaseClient, key: string) {
  if (!/^announcement:e2e-[0-9a-f-]{36}$/.test(key)) throw new Error("Cleanup is restricted to this test's announcement");
  const current = await client.from("content_documents").select("draft,published,revision").eq("key", key).maybeSingle();
  expect(current.error).toBeNull();
  if (!current.data || current.data.published?.status === "hidden") return;
  const saved = await client.rpc("save_content_document", { document_key: key, expected_revision: current.data.revision, content: { ...current.data.draft, status: "hidden" } });
  expect(saved.error).toBeNull();
  const published = await client.rpc("publish_content_document", { document_key: key, expected_revision: saved.data.revision });
  expect(published.error, "The isolated announcement must be hidden after the test").toBeNull();
}

test("independent announcement publishes while later drafts remain private, then hides", async ({ page, browser, staffClient }, testInfo) => {
  const slug = `e2e-${randomUUID()}`;
  const key = `announcement:${slug}`;
  const title = `E2E 공지 ${slug}`;
  const publishedBody = `${title} 최초 게시 본문`;
  const guest = await browser.newContext({ baseURL: process.env.E2E_BASE_URL, viewport: page.viewportSize()! });
  const publicPage = await guest.newPage();
  try {
    await signIn(page);
    await page.goto(`/admin/site?document=${encodeURIComponent(key)}`);
    await page.getByLabel("제목", { exact: true }).fill(title);
    await page.getByLabel("본문", { exact: true }).fill(publishedBody);
    await page.getByRole("button", { name: "초안 저장", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "초안을 저장했습니다" })).toContainText("초안을 저장했습니다");
    const draft = await staffClient.from("content_documents").select("draft,published").eq("key", key).single();
    expect(draft.error).toBeNull();
    expect(draft.data?.published).toBeNull();
    expect(draft.data?.draft.title).toBe(title);
    await publicPage.goto(`/announcements/${slug}`);
    await expect(publicPage.getByRole("heading", { level: 1, name: title, exact: true })).toHaveCount(0);

    await page.getByLabel("공개 상태", { exact: true }).selectOption("published");
    await page.getByRole("button", { name: "이 문서 게시", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "이 문서를 게시했습니다" })).toContainText("이 문서를 게시했습니다");
    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(publicPage.getByText(publishedBody, { exact: true })).toBeVisible();

    await page.getByLabel("제목", { exact: true }).fill(`${title} 초안 수정`);
    await page.getByLabel("본문", { exact: true }).fill(`${publishedBody} 아직 공개하지 않은 수정`);
    await page.getByRole("button", { name: "초안 저장", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "초안을 저장했습니다" })).toContainText("초안을 저장했습니다");
    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(publicPage.getByText(publishedBody, { exact: true })).toBeVisible();
    await expect(publicPage.getByText(`${publishedBody} 아직 공개하지 않은 수정`, { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("announcement-draft.png"), fullPage: true });
    await publicPage.screenshot({ path: testInfo.outputPath("announcement-public.png"), fullPage: true });

    await page.getByLabel("공개 상태", { exact: true }).selectOption("hidden");
    await page.getByRole("button", { name: "이 문서 게시", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "이 문서를 게시했습니다" })).toContainText("이 문서를 게시했습니다");
    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { level: 1, name: title, exact: true })).toHaveCount(0);
    const hidden = await staffClient.from("content_documents").select("published").eq("key", key).single();
    expect(hidden.data?.published.status).toBe("hidden");
  } finally {
    await guest.close();
    await hideTestAnnouncement(staffClient, key);
  }
});

test("guest submits an inquiry and staff assigns, notes and completes it", async ({ page, staffClient }, testInfo) => {
  const name = testName();
  const note = `${name} 운영자 전용 테스트 메모`;
  if (!await publishedConsentReady(staffClient)) { await expectConsentBlocked(page); return; }
  try {
    const item = await submitPublicInquiry(page, staffClient, name);
    const guestLink = await staffClient.from("inquiries").select("customer_id").eq("id", item.id).single();
    expect(guestLink.data?.customer_id).toBeNull();
    await page.screenshot({ path: testInfo.outputPath("guest-inquiry-receipt.png"), fullPage: true });
    await signIn(page);
    await processInquiry(page, staffClient, item, note);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("inquiry-completed.png"), fullPage: true });
  } finally { await closeTestInquiries(staffClient, name); }
});

test("member sees their completed inquiry without staff notes or assignment", async ({ page, browser, staffClient }, testInfo) => {
  test.skip(!process.env.E2E_CUSTOMER_EMAIL || !process.env.E2E_CUSTOMER_PASSWORD, "Optional staging customer credentials are missing");
  const name = testName();
  const note = `${name} 고객에게 노출하면 안 되는 내부 메모`;
  if (!await publishedConsentReady(staffClient)) { await signIn(page, "CUSTOMER"); await expectConsentBlocked(page); return; }
  const staffContext = await browser.newContext({ baseURL: process.env.E2E_BASE_URL, viewport: page.viewportSize()! });
  const staffPage = await staffContext.newPage();
  try {
    await signIn(page, "CUSTOMER");
    const item = await submitPublicInquiry(page, staffClient, name);
    const linked = await staffClient.from("inquiries").select("customer_id").eq("id", item.id).single();
    expect(linked.data?.customer_id).toBeTruthy();
    await signIn(staffPage);
    await processInquiry(staffPage, staffClient, item, note);
    await page.goto("/account/inquiries");
    const own = page.locator("article").filter({ has: page.getByRole("heading", { name: item.receipt_number, exact: true }) });
    await expect(own).toHaveCount(1);
    await expect(own).toContainText("처리 완료");
    await expect(own).toContainText(name);
    await expect(page.getByText(note, { exact: true })).toHaveCount(0);
    await expect(own).not.toContainText(process.env.E2E_ADMIN_EMAIL!);
    await expect(own).not.toContainText("담당자");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("member-inquiry.png"), fullPage: true });
  } finally {
    await staffContext.close();
    await closeTestInquiries(staffClient, name);
  }
});

test("manual inquiry RPC is idempotent and rejects a changed payload with the same key", async ({ staffClient }) => {
  const name = testName();
  const consentReady = await publishedConsentReady(staffClient);
  const input = { idempotencyKey: randomUUID(), name, phone: `0100000${randomInt(1000, 10000)}`, service: "bathroom", region: "E2E 테스트 지역", message: `${name} 수동 접수 중복 방지 테스트`, consent: true, source: "phone" };
  try {
    const first = await staffClient.rpc("admin_create_inquiry", { p_input: input });
    if (!consentReady) {
      expect(first.error?.message).toContain("inquiry_policy_unavailable");
      const blocked = await staffClient.from("inquiries").select("id", { count: "exact" }).eq("name", name);
      expect(blocked.error).toBeNull();
      expect(blocked.count).toBe(0);
      return;
    }
    expect(first.error).toBeNull();
    const second = await staffClient.rpc("admin_create_inquiry", { p_input: input });
    expect(second.error).toBeNull();
    expect(second.data).toEqual(first.data);
    const conflict = await staffClient.rpc("admin_create_inquiry", { p_input: { ...input, message: `${input.message} 다른 내용` } });
    expect(conflict.error?.message).toContain("idempotency_conflict");
    const rows = await staffClient.from("inquiries").select("id", { count: "exact" }).eq("name", name);
    expect(rows.error).toBeNull();
    expect(rows.count).toBe(1);
    expect(rows.data?.[0].id).toBe(first.data.id);
  } finally { await closeTestInquiries(staffClient, name); }
});
