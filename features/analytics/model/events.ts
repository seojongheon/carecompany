export const ANALYTICS_CONSENT_KEY = "analytics-consent-v1";
export const ANALYTICS_VISITOR_KEY = "analytics-visitor-v1";
export const ANALYTICS_VISIT_KEY = "analytics-visit-v1";
const publicPage = /^\/(?:$|services(?:\/(?:bathroom|aircon|apartment-window|commercial-window))?$|portfolio(?:\/[a-z0-9-]+)?$|pricing$|about$|process$|privacy$|inquiry$|faq$|announcements(?:\/[a-z0-9-]+)?$)/;
export function normalizeAnalyticsPage(path: string): string | null {
 const value=path.split(/[?#]/)[0];
 return value.length<=240 && publicPage.test(value) ? value : null;
}
export const ANALYTICS_CAMPAIGNS = ["naver-search", "google-search", "kakao-channel", "instagram", "offline"] as const;
export function allowedCampaign(value: string | null): string | null { return value && (ANALYTICS_CAMPAIGNS as readonly string[]).includes(value) ? value : null; }
export function classifyDevice(userAgent: string): "mobile"|"desktop"|"tablet" { return /ipad|tablet/i.test(userAgent)?"tablet":/mobi|android/i.test(userAgent)?"mobile":"desktop"; }
export function nextVisit(previous: {id:string;lastSeen:number}|null,now:number,newId:string): string { return previous && now-previous.lastSeen>=0 && now-previous.lastSeen<30*60_000?previous.id:newId; }
export interface AnalyticsInput {consent:boolean;isStaff:boolean;path:string;visitorId:string;sessionId:string;referrer:string;userAgent:string;search:string;}
export function buildAnalyticsEvent(input:AnalyticsInput) {
 const path=normalizeAnalyticsPage(input.path);
 if(!input.consent||input.isStaff||!path||/bot|spider|crawler|headless/i.test(input.userAgent)) return null;
 let referrer="direct";
 try { referrer=new URL(input.referrer).hostname.slice(0,200); } catch { /* direct navigation */ }
 const params=new URLSearchParams(input.search);
 return {eventId:crypto.randomUUID(),visitorId:input.visitorId,sessionId:input.sessionId,path,referrer,device:classifyDevice(input.userAgent),campaign:allowedCampaign(params.get("utm_campaign")),consent:true as const};
}
