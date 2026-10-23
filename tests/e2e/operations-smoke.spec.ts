import AxeBuilder from "@axe-core/playwright";
import {test,expect} from "@playwright/test";
import {SITE_CONTENT_SEED} from "../../features/site-content/model/seed";
// Explicit browser fixtures verify presentation only. Authenticated staging tests
// exercise real persistence separately and must not be replaced by this suite.
test.beforeEach(async({page})=>{
 await page.route("**/rest/v1/rpc/get_published_site_content",route=>route.fulfill({json:{...SITE_CONTENT_SEED,policy:{title:"검증용 정책",body:"검증용 정책 본문",effectiveDate:"2026-10-19",inquiryConsent:"게시된 검증용 문의 동의 문구입니다.",reviewed:true}}}));
});
test("inquiry failure preserves input at desktop and mobile widths",async({page},testInfo)=>{
 await page.route("**/api/inquiries",route=>route.fulfill({status:503,json:{error:"접수 연결을 확인하고 다시 시도해 주세요."}}));
 await page.goto("/inquiry");
 await page.getByLabel("이름",{exact:true}).fill("검증 고객");await page.getByLabel("전화번호",{exact:true}).fill("01012345678");
 await page.getByLabel("서비스",{exact:true}).selectOption("bathroom");await page.getByLabel("지역",{exact:true}).fill("천안");await page.getByLabel("문의 내용",{exact:true}).fill("화장실 청소 문의입니다.");
 await page.getByRole("checkbox").check();await page.getByRole("button",{name:"문의 접수",exact:true}).click();
 await expect(page.getByRole("alert").filter({hasText:"다시 시도"})).toBeVisible();await expect(page.getByLabel("문의 내용",{exact:true})).toHaveValue("화장실 청소 문의입니다.");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 const results=await new AxeBuilder({page}).disableRules(["color-contrast"]).analyze();expect(results.violations.filter(v=>["serious","critical"].includes(v.impact??""))).toEqual([]);
 await page.screenshot({path:testInfo.outputPath("inquiry.png"),fullPage:true});
});
test("browser consent prevents collection before opt-in and after withdrawal",async({page})=>{
 let events=0;await page.route("**/api/analytics",route=>{events++;return route.fulfill({status:204});});
 await page.goto("/inquiry");await expect(page.getByRole("region",{name:"방문 분석 동의"})).toBeVisible();expect(events).toBe(0);
 await page.getByRole("button",{name:"동의",exact:true}).click();await expect.poll(()=>events).toBe(1);
 await page.getByRole("button",{name:"방문 분석 설정"}).click();await page.getByRole("button",{name:"동의 철회"}).click();
 expect(await page.evaluate(()=>localStorage.getItem("analytics-visitor-v1"))).toBeNull();
 await page.goto("/pricing");await expect(page.getByRole("button",{name:"방문 분석 설정"})).toBeVisible();expect(events).toBe(1);
});
