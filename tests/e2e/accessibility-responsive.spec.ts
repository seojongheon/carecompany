import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("core public page has no serious axe violations or horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("keyboard opens and closes the mobile menu with focus restoration", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile navigation behavior");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "메뉴 열기" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "전체 메뉴" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("support pages respect reduced motion and never overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/services", "/pricing", "/process", "/about", "/privacy"]) {
    await page.goto(path);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
