import { describe, expect, it } from "vitest";
import { normalizeAnalyticsPage, classifyDevice, nextVisit, buildAnalyticsEvent, allowedCampaign } from "@/features/analytics/model/events";
describe("consent analytics boundary",()=>{
 it("excludes private routes and strips queries",()=>{
  expect(normalizeAnalyticsPage("/admin/inquiries?phone=010")).toBeNull();
  expect(normalizeAnalyticsPage("/account/inquiries")).toBeNull();
  expect(normalizeAnalyticsPage("/auth/callback")).toBeNull();
  expect(normalizeAnalyticsPage("/portfolio/clean?email=secret@example.com")).toBe("/portfolio/clean");
  expect(normalizeAnalyticsPage("https://evil.example/a")).toBeNull();
 });
 it("does not generate events without consent or for staff",()=>{
  const base={consent:false,isStaff:false,path:"/",visitorId:"visitor",sessionId:"session",referrer:"https://search.example/path?q=secret",userAgent:"Mozilla",search:"?email=private"};
  expect(buildAnalyticsEvent(base)).toBeNull();
  expect(buildAnalyticsEvent({...base,consent:true,isStaff:true})).toBeNull();
  expect(buildAnalyticsEvent({...base,consent:true})).toMatchObject({path:"/",referrer:"search.example"});
 });
 it("creates a new visit after thirty minutes and rejects free text campaigns",()=>{
  expect(nextVisit({id:"old",lastSeen:0},29*60_000,"new")).toBe("old");
  expect(nextVisit({id:"old",lastSeen:0},30*60_000,"new")).toBe("new");
  expect(allowedCampaign("some@email.com")).toBeNull();
  expect(allowedCampaign("spring-2026")).toBeNull();
  expect(allowedCampaign("01012345678")).toBeNull();
  expect(allowedCampaign("naver-search")).toBe("naver-search");
  expect(classifyDevice("Mozilla iPad")).toBe("tablet");
 });
});
