import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("customer sign-up is available without any administrator option", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByRole("link", { name: /관리자.*회원가입/ })).toHaveCount(0);
});

test("administrator pages stay locked and expose no sign-up", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: /회원가입/ })).toHaveCount(0);
});
