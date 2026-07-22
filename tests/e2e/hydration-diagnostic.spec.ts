import { expect, test } from "./fixtures";

test("client runtime hydrates without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/portfolio");
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
