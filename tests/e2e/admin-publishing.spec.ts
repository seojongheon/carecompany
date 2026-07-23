import { expect, test } from "./fixtures";

test.skip(true, "Supabase 관리자 인증이 연결될 때까지 관리자 게시 E2E를 보류합니다.");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("file selection completes locally and refresh shows fallback metadata", async ({ page }) => {
  await page.goto("/admin/portfolio/case-bathroom-5/edit");
  await page.getByLabel("작업 후 사진 파일 선택", { exact: true }).setInputFiles({ name: "field.jpg", mimeType: "image/jpeg", buffer: Buffer.from("mock-image") });
  await expect(page.getByText("field.jpg")).toBeVisible();
  await expect(page.getByText("완료")).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByText(/새로고침하면 안전한 목업 이미지/)).toBeVisible();
});

test("published case can be removed from customer selectors immediately", async ({ page }) => {
  await page.goto("/admin/portfolio/case-bathroom-1/edit");
  await page.getByRole("button", { name: "비공개로 전환" }).click();
  await page.getByRole("button", { name: "비공개 전환 확인" }).click();
  await page.goto("/portfolio/bathroom-cheonan-asan-1");
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
});

test("upload limits, organization, YouTube validation, and publication boundary work together", async ({ page }) => {
  await page.goto("/admin/portfolio/case-bathroom-5/edit");
  const input = page.getByLabel("작업 후 사진 파일 선택", { exact: true });
  await input.setInputFiles(Array.from({ length: 21 }, (_, index) => ({ name: `${index}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from("x") })));
  await expect(page.getByRole("alertdialog")).toContainText("한 번에 최대 20장");
  await page.getByRole("button", { name: "확인" }).click();
  await input.setInputFiles({ name: "fail.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") });
  await expect(page.getByText("실패", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "fail.jpg 다시 시도" }).click();
  await expect(page.getByText("완료", { exact: true })).toBeVisible();

  await page.getByLabel("YouTube 주소").fill("https://vimeo.com/invalid");
  await page.getByRole("button", { name: "영상 추가" }).click();
  await expect(page.getByText("지원하는 YouTube 주소를 입력해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "사례 공개" })).toBeDisabled();

  const photoChecks = page.getByRole("checkbox", { name: /사진 선택/ });
  await photoChecks.first().check();
  await page.getByLabel("선택 사진 단계").selectOption("after");
  await page.getByRole("button", { name: "선택 사진 공개" }).click();
  const firstPhoto = page.locator("section").filter({ has: page.getByRole("heading", { name: "사진 관리" }) }).locator("article").first();
  await firstPhoto.getByRole("radio").check();
  for (const check of await page.locator("section").filter({ has: page.getByRole("heading", { name: "공개 전 개인정보 검토" }) }).getByRole("checkbox").all()) await check.check();
  await page.getByRole("button", { name: "사례 공개" }).click();
  await expect(page.getByText("사례를 공개했습니다. 고객 화면에 즉시 반영됩니다.")).toBeVisible();
  await page.goto("/portfolio/bathroom-cheonan-asan-5");
  await expect(page.getByRole("heading", { name: /공개 전 검토 중인 새 작업 기록/ })).toBeVisible();
});

test("69 saved photos lock further selection", async ({ page }) => {
  await page.goto("/admin/portfolio/case-bathroom-5/edit");
  await page.getByLabel("요약").fill("사진 한도 검증용 저장");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await page.waitForFunction(() => Boolean(localStorage.getItem("hygiene-technology:portfolio:v1")));
  await page.evaluate(() => {
    const key = "hygiene-technology:portfolio:v1";
    const store = JSON.parse(localStorage.getItem(key)!);
    const source = store.media.find((item: { caseId: string }) => item.caseId === "case-bathroom-5");
    const current = store.media.filter((item: { caseId: string }) => item.caseId === "case-bathroom-5").length;
    for (let index = current; index < 69; index += 1) store.media.push({ ...source, id: `media-limit-${index}`, sortOrder: index, cover: false, public: false });
    localStorage.setItem(key, JSON.stringify(store));
  });
  await page.reload();
  await expect(page.getByText(/현재 전체 69 \/ 69장/).first()).toBeVisible();
  await expect(page.getByLabel("작업 전 사진 파일 선택", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("작업 후 사진 파일 선택", { exact: true })).toBeDisabled();
});
