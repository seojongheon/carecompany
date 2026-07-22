import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("customer can sign up, view the account, and sign out", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("이메일").fill("customer@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("Safe-password-2026");
  await page.getByLabel("비밀번호 확인").fill("Safe-password-2026");
  await page.getByRole("checkbox", { name: /개인정보처리방침/ }).check();
  await page.getByRole("button", { name: "회원가입" }).click();
  await expect(page.getByRole("status")).toContainText("회원가입이 완료되었습니다");
  await page.goto("/account");
  await expect(page.getByText("customer@example.com")).toBeVisible();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible();
});

test("administrator pages stay locked and expose no sign-up", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "관리자 인증이 필요합니다" })).toBeVisible();
  await page.getByRole("link", { name: "관리자 로그인" }).click();
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: /회원가입/ })).toHaveCount(0);
});
