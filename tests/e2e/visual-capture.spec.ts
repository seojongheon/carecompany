import { test } from "./fixtures";

test("capture reference layouts", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("desktop"), "single capture project");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("#main-content").waitFor();
  await page.screenshot({ path: "docs/verification/screenshots/home-1440x900.png", fullPage: true });
  await page.goto("/admin");
  await page.getByRole("heading", { name: "관리자 인증이 필요합니다" }).waitFor();
  await page.screenshot({ path: "docs/verification/screenshots/admin-1440x900.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#main-content").waitFor();
  await page.screenshot({ path: "docs/verification/screenshots/home-390x844.png", fullPage: true });
  await page.goto("/admin/login");
  await page.getByRole("heading", { name: "관리자 로그인" }).waitFor();
  await page.screenshot({ path: "docs/verification/screenshots/admin-edit-390x844.png", fullPage: true });
});
