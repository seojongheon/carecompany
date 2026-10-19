import { test, expect, signIn, stagingReady, stagingSkipReason } from "./admin-fixtures";

test.skip(!stagingReady, stagingSkipReason);

test("authenticated staff creates, saves, refreshes and filters a private draft", async ({ page, createCase, staffClient }, testInfo) => {
  await signIn(page);
  const item = await createCase();
  await page.goto(`/admin/portfolio/${item.id}/edit`);
  const changed = `${item.title} 수정`;
  await page.getByLabel("사례 제목", { exact: true }).fill(changed);
  await page.getByLabel("요약", { exact: true }).fill("비공개로 저장된 E2E 사례 설명");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect.poll(async () => (await staffClient.from("case_revision_drafts").select("manifest").eq("case_id", item.id).single()).data?.manifest?.case?.title).toBe(changed);
  await page.reload();
  await expect(page.getByLabel("사례 제목", { exact: true })).toHaveValue(changed);
  await page.goto(`/admin/portfolio?status=private&q=${encodeURIComponent(changed)}`);
  await expect(page.getByTestId("admin-case-row")).toHaveCount(1);
  await expect(page.getByTestId("admin-case-row")).toContainText(changed);
  await expect(page.getByTestId("admin-case-row")).toContainText("편집 초안 있음");
  await expect(page).toHaveURL(/status=private/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("case-list.png"), fullPage: true });
});

test("stale editor preserves typed input after a real revision conflict", async ({ page, createCase, staffClient }, testInfo) => {
  await signIn(page); const item = await createCase();
  await page.goto(`/admin/portfolio/${item.id}/edit`);
  await expect(page.getByLabel("사례 제목", { exact: true })).toHaveValue(item.title);
  const current = await staffClient.from("portfolio_cases").select("revision").eq("id", item.id).single();
  const external = await staffClient.rpc("save_case_revision", { case_id: item.id, expected_revision: current.data!.revision, patch: { case: { title: "다른 관리자 저장" } } });
  expect(external.error).toBeNull();
  await page.getByLabel("사례 제목", { exact: true }).fill("충돌해도 남아 있는 내 입력");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "다른 관리자가 먼저 저장했습니다" }).first()).toBeVisible();
  await expect(page.getByLabel("사례 제목", { exact: true })).toHaveValue("충돌해도 남아 있는 내 입력");
  expect((await staffClient.from("case_revision_drafts").select("manifest").eq("case_id", item.id).single()).data?.manifest.case.title).toBe("다른 관리자 저장");
  await page.screenshot({ path: testInfo.outputPath("case-conflict.png"), fullPage: true });
});

test("failed save keeps the valid form input", async ({ page, createCase }) => {
  await signIn(page); const item = await createCase();
  await page.goto(`/admin/portfolio/${item.id}/edit`);
  await expect(page.getByLabel("사례 제목", { exact: true })).toBeVisible();
  await page.route("**/rest/v1/rpc/save_case_revision", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "test unavailable" }) }));
  await page.getByLabel("요약", { exact: true }).fill("저장 실패 후에도 유지되어야 하는 설명");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "저장에 실패했습니다" }).first()).toBeVisible();
  await expect(page.getByLabel("요약", { exact: true })).toHaveValue("저장 실패 후에도 유지되어야 하는 설명");
});

test("anonymous users cannot open protected case management", async ({ page }) => {
  await page.goto("/admin/portfolio");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});

test("customers cannot open protected case management", async ({ page }) => {
  test.skip(!process.env.E2E_CUSTOMER_EMAIL || !process.env.E2E_CUSTOMER_PASSWORD, "Optional staging customer credentials are missing");
  await signIn(page, "CUSTOMER"); await page.goto("/admin/portfolio");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("suspended staff cannot start a protected session", async ({ page }) => {
  test.skip(!process.env.E2E_SUSPENDED_EMAIL || !process.env.E2E_SUSPENDED_PASSWORD, "Optional staging suspended-staff credentials are missing");
  await signIn(page, "SUSPENDED");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/admin/portfolio"); await expect(page).toHaveURL(/\/admin\/login$/);
});

test("master can access the protected operations shell", async ({ page }) => {
  test.skip(!process.env.E2E_SUPER_ADMIN_EMAIL || !process.env.E2E_SUPER_ADMIN_PASSWORD, "Optional staging master credentials are missing");
  await signIn(page, "SUPER_ADMIN"); await page.goto("/admin/portfolio");
  await expect(page.getByRole("link", { name: "사례 추가" })).toBeVisible();
});
