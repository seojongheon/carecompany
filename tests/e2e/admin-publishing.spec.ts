import { test, expect, signIn, stagingReady, stagingSkipReason } from "./admin-fixtures";
import type { Locator, Page } from "@playwright/test";

test.skip(!stagingReady, stagingSkipReason);
test.skip(process.env.E2E_CASE_STORAGE_READY !== "true", "Case Storage is not declared ready; no bucket visibility or configuration is changed by tests");
// A valid 16×16 RGB PNG generated with sharp for the browser's createImageBitmap path.
const image = { name: "reviewed-test.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAGElEQVR4nGPQyvAkCTGMasgYDSWt4Zo0AE+x2wH1RrIuAAAAAElFTkSuQmCC", "base64") };
async function ensureChecked(control: Locator) {
  if (!await control.isChecked()) await control.click();
  await expect(control).toBeChecked();
}
async function review(page: Page) {
  const checklist = page.locator("section").filter({ has: page.getByRole("heading", { name: "공개 전 개인정보 검토", exact: true }) });
  for (const checkbox of await checklist.getByRole("checkbox").all()) await ensureChecked(checkbox);
}

test("publishes only reviewed media, preserves public output during edits and restores privately", async ({ page, browser, createCase, staffClient }, testInfo) => {
  await signIn(page); const item = await createCase();
  await page.goto(`/admin/portfolio/${item.id}/edit`);
  await expect(page.getByRole("button", { name: "사례 공개", exact: true })).toBeDisabled();
  await page.getByLabel("작업 후 사진 파일 선택", { exact: true }).setInputFiles(image);
  const photos = page.locator("section").filter({ has: page.getByRole("heading", { name: "사진 관리", exact: true }) });
  await expect(photos.locator("article")).toHaveCount(1);
  await ensureChecked(photos.getByRole("checkbox", { name: "고객 공개", exact: true }));
  await ensureChecked(photos.getByRole("radio", { name: "대표 사진", exact: true }));
  await expect(page.getByRole("button", { name: "사례 공개", exact: true })).toBeDisabled();
  await review(page);
  await page.getByRole("button", { name: "사례 공개", exact: true }).click();
  await expect(page.getByText("사례를 공개했습니다. 고객 화면에 즉시 반영됩니다.")).toBeVisible();
  const projection = await staffClient.from("case_media").select("storage_path").eq("case_id", item.id).single();
  expect(projection.data?.storage_path).toBeTruthy();
  const guest = await browser.newContext({ viewport: page.viewportSize()! });
  const publicPage = await guest.newPage();
  try {
    await publicPage.goto(`${process.env.E2E_BASE_URL}/portfolio/${item.slug}`);
    await expect(publicPage.getByRole("heading", { level: 1, name: item.title, exact: true })).toBeVisible();
    await page.getByLabel("사례 제목", { exact: true }).fill(`${item.title} 재공개`);
    await page.getByRole("button", { name: "지금 저장" }).click();
    await expect.poll(async () => (await staffClient.from("case_revision_drafts").select("manifest").eq("case_id", item.id).single()).data?.manifest.case.title).toBe(`${item.title} 재공개`);
    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { level: 1, name: item.title, exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("published-with-draft.png"), fullPage: true });
    await page.getByRole("button", { name: "변경 내용 재공개" }).click();
    await expect.poll(async () => (await staffClient.from("portfolio_cases").select("title").eq("id", item.id).single()).data?.title).toBe(`${item.title} 재공개`);
    await publicPage.reload(); await expect(publicPage.getByRole("heading", { level: 1, name: `${item.title} 재공개`, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "휴지통으로 이동", exact: true }).click();
    await page.getByRole("button", { name: "삭제 확인" }).click();
    await expect(page.getByRole("button", { name: "휴지통에서 복원" })).toBeVisible();
    await page.getByRole("button", { name: "휴지통에서 복원" }).click();
    await page.getByRole("alertdialog", { name: "사례 변경 확인" }).getByRole("button", { name: "확인", exact: true }).click();
    await expect.poll(async () => (await staffClient.from("portfolio_cases").select("status").eq("id", item.id).single()).data?.status).toBe("private");
    await publicPage.reload(); await expect(publicPage.getByRole("heading", { level: 1, name: `${item.title} 재공개`, exact: true })).toHaveCount(0);
  } finally { await guest.close(); }
});

test("rejects the 21st selection and enforces privacy review for added public photos", async ({ page, createCase, staffClient }, testInfo) => {
  await signIn(page); const item = await createCase(); await page.goto(`/admin/portfolio/${item.id}/edit`);
  const input = page.getByLabel("작업 후 사진 파일 선택", { exact: true });
  await input.setInputFiles(Array.from({ length: 21 }, (_, index) => ({ ...image, name: `limit-${index}.png` })));
  await expect(page.getByRole("alertdialog")).toContainText("한 번에 최대 20장");
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await input.setInputFiles(image);
  const photos = page.locator("section").filter({ has: page.getByRole("heading", { name: "사진 관리", exact: true }) });
  await expect(photos.locator("article")).toHaveCount(1);
  await review(page);
  await ensureChecked(photos.getByRole("checkbox", { name: "고객 공개", exact: true }));
  await expect(page.getByRole("checkbox", { name: "공개 사진을 최종 검토함", exact: true })).not.toBeChecked();
  await page.getByLabel("YouTube 주소", { exact: true }).fill("https://vimeo.com/invalid");
  await page.getByRole("button", { name: "영상 추가", exact: true }).click();
  await expect(page.getByText("지원하는 YouTube 주소를 입력해 주세요.")).toBeVisible();
  for (const id of ["abcdefghij1", "abcdefghij2", "abcdefghij3"]) {
    await page.getByLabel("YouTube 주소", { exact: true }).fill(`https://youtu.be/${id}`);
    await page.getByRole("button", { name: "영상 추가", exact: true }).click();
    await expect(page.getByLabel("YouTube 주소", { exact: true })).toHaveValue("");
  }
  await expect(page.getByRole("button", { name: "영상 추가", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("case-media-validation.png"), fullPage: true });
  // Finish browser editing before exercising the database limit directly.
  // An editor autosave racing this separate client is correctly rejected as a conflict.
  await page.goto("/admin/portfolio");
  await expect(page.getByRole("link", { name: "사례 추가", exact: true })).toBeVisible();
  const state = (await staffClient.from("case_revision_drafts").select("manifest,revision").eq("case_id", item.id).single()).data!;
  const tooMany = Array.from({ length: 70 }, (_, index) => ({ ...state.manifest.media[0], id: `limit-${index}`, cover: false }));
  const rejected = await staffClient.rpc("save_case_revision", { case_id: item.id, expected_revision: state.revision, patch: { media: tooMany } });
  expect(rejected.error?.message).toContain("case_media_limit_exceeded");
  expect((await staffClient.from("case_revision_drafts").select("manifest").eq("case_id", item.id).single()).data?.manifest.media).toHaveLength(1);
});
