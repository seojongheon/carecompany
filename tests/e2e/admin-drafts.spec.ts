import { expect, test } from "./fixtures";

test.skip(true, "Supabase 관리자 인증이 연결될 때까지 관리자 편집 E2E를 보류합니다.");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("admin opens directly and creates a restorable private draft", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "관리자 대시보드" })).toBeVisible();
  await page.goto("/admin/portfolio/new");
  await page.getByLabel("사례 제목").fill("E2E 새 사례");
  await page.getByLabel("서비스").selectOption("service-bathroom");
  await page.getByLabel("표시 지역").fill("천안 서북구");
  await page.getByLabel("사례 경로").fill("e2e-new-case");
  await page.getByRole("button", { name: "비공개 초안 만들기" }).click();
  await expect(page.getByRole("status")).toContainText("비공개 초안");
  await page.reload();
  await page.goto("/admin/portfolio");
  await page.getByLabel("공개 상태").selectOption("private");
  await expect(page.getByText("E2E 새 사례")).toBeVisible();
});

test("corrupt browser data recovers with a visible notice", async ({ page }) => {
  await page.goto("/admin");
  await page.evaluate(() => localStorage.setItem("hygiene-technology:portfolio:v1", "broken"));
  await page.reload();
  await expect(page.getByText(/기본 사례로 복구/)).toBeVisible();
});

test("edit validation, autosave refresh, and list filters preserve a draft", async ({ page }) => {
  await page.goto("/admin/portfolio/new");
  await page.getByRole("button", { name: "비공개 초안 만들기" }).click();
  await expect(page.getByText("제목을 입력해 주세요.")).toBeVisible();
  await page.goto("/admin/portfolio/case-bathroom-5/edit");
  const title = page.getByLabel("사례 제목");
  await title.fill("브라우저 자동 저장 사례");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await page.waitForFunction(() => {
    const stored = localStorage.getItem("hygiene-technology:portfolio:v1");
    return stored && JSON.parse(stored).cases.some((item: { id: string; title: string }) => item.id === "case-bathroom-5" && item.title === "브라우저 자동 저장 사례");
  });
  await page.reload();
  await expect(title).toHaveValue("브라우저 자동 저장 사례");
  await page.goto("/admin/portfolio");
  await page.getByLabel("공개 상태").selectOption("private");
  await expect(page.getByText("브라우저 자동 저장 사례")).toBeVisible();
});

test("quota failure keeps the typed value visible", async ({ page }) => {
  await page.goto("/admin/portfolio/case-bathroom-5/edit");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "hygiene-technology:portfolio:v1") throw new DOMException("quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const summary = page.getByLabel("요약");
  await summary.fill("저장 실패 중에도 화면에 남는 입력");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect(page.getByText("브라우저 저장에 실패했습니다. 입력 내용은 현재 화면에 유지됩니다.")).toBeVisible();
  await expect(summary).toHaveValue("저장 실패 중에도 화면에 남는 입력");
});
