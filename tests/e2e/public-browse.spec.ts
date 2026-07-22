import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("home exposes four services and public portfolio load-more", async ({ page }) => {
  for (const name of ["화장실 청소", "에어컨 청소", "아파트 유리창 청소", "상가 유리창 청소"]) {
    await expect(page.getByRole("link", { name }).first()).toBeVisible();
  }
  await page.goto("/portfolio");
  await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(9);
  await page.getByRole("button", { name: "사례 더 보기" }).click();
  await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(16);
});

test("filter state belongs to the URL and survives reload", async ({ page }) => {
  await page.goto("/portfolio");
  const serviceFilter = page.locator("#main-content").getByLabel("서비스 필터");
  await serviceFilter.selectOption("aircon");
  await expect(page).toHaveURL(/service=aircon/);
  await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(4);
  await page.reload();
  await expect(page.locator("#main-content").getByLabel("서비스 필터")).toHaveValue("aircon");
  await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(4);
});
