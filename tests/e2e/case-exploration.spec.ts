import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("list click intercepts as quick view and Back restores the list", async ({ page }) => {
  test.skip(true, "실제 게시 사례가 등록된 뒤 실행합니다.");
  await page.goto("/portfolio?service=aircon");
  const first = page.locator('[data-testid="portfolio-card"]').first();
  await first.getByRole("link").click();
  await expect(page).toHaveURL(/\/portfolio\/aircon-cheonan-asan-/);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1 / 4");
  await page.getByRole("button", { name: "다음 사례" }).click();
  await expect(page).toHaveURL(/\/portfolio\/aircon-cheonan-asan-.*service=aircon/);
  await expect(page.getByRole("dialog")).toContainText("2 / 4");
  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio\?service=aircon/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("direct detail groups media and lazy-loads video", async ({ page }) => {
  test.skip(true, "실제 게시 사례가 등록된 뒤 실행합니다.");
  await page.goto("/portfolio/bathroom-cheonan-asan-1");
  await expect(page.getByRole("heading", { name: "작업 전", exact: true })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: /영상 재생/ }).click();
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("iframe")).not.toHaveAttribute("src", /autoplay=1/);
  const galleryButton = page.locator("main button").filter({ has: page.locator("img") }).first();
  await galleryButton.click();
  await expect(page.locator(".yarl__root")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".yarl__root")).toHaveCount(0);
});

test("private and unknown direct routes share generic 404 copy", async ({ page }) => {
  for (const slug of ["bathroom-cheonan-asan-5", "unknown-case"]) {
    await page.goto(`/portfolio/${slug}`);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
  }
});

test("Back restores the originating card focus and list scroll", async ({ page }) => {
  test.skip(true, "실제 게시 사례가 등록된 뒤 실행합니다.");
  await page.goto("/portfolio?service=aircon");
  const link = page.locator('[data-testid="portfolio-card"]').nth(3).getByRole("link");
  await link.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await link.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(link).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(Math.max(0, before - 10));
});
