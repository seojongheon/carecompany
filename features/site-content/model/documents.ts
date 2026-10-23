import { z } from "zod";
import { SERVICE_KEYS } from "@/features/portfolio/model/types";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { SITE_CONTENT_SEED } from "./seed";

const text = z.string().trim().max(10000);
const required = text.min(1, "필수 내용을 입력해 주세요.");
const link = text.refine((value) => /^\/(?!\/)[^\\]*$/.test(value) || /^https:\/\/[^\s]+$/.test(value) || /^tel:\+?[\d -]+$/.test(value) || /^mailto:[^\s@]+@[^\s@]+$/.test(value), "올바른 내부 경로 또는 https 링크를 입력해 주세요.");
export const imageSchema = z.object({ path: text.refine(value => !value || /^(site|hero)\/[a-zA-Z0-9._/-]+$/.test(value), "사이트 이미지 경로만 사용할 수 있습니다."), alt: text, focalX: z.number().min(0).max(100), focalY: z.number().min(0).max(100) }).refine((value) => !value.path || !!value.alt.trim(), "이미지 대체 설명이 필요합니다.");
const image = imageSchema.default({ path: "", alt: "", focalX: 50, focalY: 50 });
const sort = z.number().int().min(0);
const row = { id: required, visible: z.boolean(), sortOrder: sort };
export const priceSchema = z.object({ ...row, serviceKey: z.enum(SERVICE_KEYS), name: required, priceLabel: required, unit: text.default(""), minPrice: z.number().nonnegative().nullable().default(null), maxPrice: z.number().nonnegative().nullable().default(null), conditions: z.array(text).max(30), inclusions: z.array(text).max(30).default([]), exclusions: z.array(text).max(30).default([]) }).refine((value) => value.minPrice === null || value.maxPrice === null || value.maxPrice >= value.minPrice, "최대 금액은 최소 금액 이상이어야 합니다.");
const schemas = {
  home: z.object({ eyebrow: text, title: required, description: required, primaryCtaLabel: required, primaryCtaHref: link, heroImageAlt: required, heroAssetKey: text, heroImageStoragePath: text.optional(), image, sections: z.array(z.object({ ...row, title: required, description: text })).max(12).default([]), recommendations: z.array(z.string().uuid()).max(12).default([]), blocks:z.array(z.object({key:z.enum(["services","recent","recommendations","additional"]),visible:z.boolean(),sortOrder:sort})).length(4).refine(rows=>new Set(rows.map(row=>row.key)).size===4,"홈 섹션이 중복됩니다.").default([{key:"services",visible:true,sortOrder:0},{key:"recent",visible:true,sortOrder:1},{key:"recommendations",visible:true,sortOrder:2},{key:"additional",visible:true,sortOrder:3}]) }),
  about: z.object({ title: required, description: required, values: z.array(z.object({ id: required, title: required, description: text })).max(12), image, ctaLabel: required.default("작업 사례 보기"), ctaHref: link.default("/portfolio") }),
  process: z.object({ title: required, description: text, steps: z.array(z.object({ ...row, title: required, description: required, image })).min(1).max(30) }),
  policy: z.object({ title: required, body: required, effectiveDate: z.iso.date(), inquiryConsent: required, reviewed: z.boolean() }),
  settings: z.object({ businessName: required, representative: text, registrationNumber: text, footerDescription: text, contactLabel: required, contactHref: link, logo: image, phone: text, address: text, hours: text, regions: z.array(text), email: z.union([z.email(), z.literal("")]), socialHref: z.union([link, z.literal("")]), kakaoHref: z.union([link, z.literal("")]), seoTitle: required, seoDescription: required, shareImage: image, headerCtaLabel: required, headerCtaHref: link }),
  pricing: z.object({ lead: required, items: z.array(priceSchema).max(100) }).refine((value) => new Set(value.items.map((item) => item.id)).size === value.items.length, "가격 항목 ID가 중복됩니다."),
  faq: z.object({ items: z.array(z.object({ ...row, question: required, answer: required, category: z.enum(["common", "service", "pricing"]), serviceKey: z.union([z.enum(SERVICE_KEYS), z.literal("")]) })).max(100) }),
  service: z.object({ key: z.enum(SERVICE_KEYS), name: required, summary: required, description: required, coverAssetKey: text, image, active: z.boolean(), sortOrder: sort, inclusions: z.array(text).max(30), exclusions: z.array(text).max(30), scope:text.default(""), precautions:z.array(text).max(30).default([]), faqIds:z.array(text).max(50).default([]), caseIds:z.array(z.string().uuid()).max(50).default([]) }),
  announcement: z.object({ title: required, body: required, image, images:z.array(z.object({id:required,image:imageSchema})).max(10).default([]), pinned: z.boolean(), status: z.enum(["published", "hidden"]) }),
};
export type ContentImage = z.infer<typeof imageSchema>;
export type PricingDocument = z.infer<typeof schemas.pricing>;
export type FaqDocument = z.infer<typeof schemas.faq>;
export type PolicyDocument = z.infer<typeof schemas.policy>;
export type SettingsDocument = z.infer<typeof schemas.settings>;
export type ServiceDocument = z.infer<typeof schemas.service>;
export type AnnouncementDocument = z.infer<typeof schemas.announcement>;
export type DocumentBody = Record<string, unknown>;
export interface ContentDocument { key: string; revision: number; draft: DocumentBody; published: DocumentBody | null; published_at: string | null; updated_at: string; }
export interface ContentVersion { id: string; document_key: string; revision: number; content: DocumentBody; created_at: string; }
export const DOCUMENT_LABELS: Record<string, string> = { home: "홈", about: "업체 소개", process: "작업 과정", policy: "개인정보처리방침", settings: "공통 설정", pricing: "가격 안내", faq: "자주 묻는 질문" };
export function mayEditDocument(key: string, role: string) { return (role === "admin" || role === "super_admin") && (!(key === "policy" || key === "settings") || role === "super_admin"); }
export function documentKind(key: string): keyof typeof schemas | null {
  if (key.startsWith("service:") && SERVICE_KEYS.includes(key.slice(8) as typeof SERVICE_KEYS[number])) return "service";
  if (/^announcement:[a-z0-9-]{1,80}$/.test(key)) return "announcement";
  return Object.hasOwn(schemas, key) && key !== "service" && key !== "announcement" ? key as keyof typeof schemas : null;
}
export function validateDocument(key: string, value: unknown, publishing = false): { ok: true; data: DocumentBody } | { ok: false; issues: string[] } {
  const kind = documentKind(key);
  if (!kind) return { ok: false, issues: ["지원하지 않는 문서입니다."] };
  const parsed = schemas[kind].safeParse(value);
  if (!parsed.success) return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  if (kind === "service" && (parsed.data as ServiceDocument).key !== key.slice(8)) return { ok: false, issues: ["서비스 키는 변경할 수 없습니다."] };
  if (publishing && kind === "policy" && !(parsed.data as PolicyDocument).reviewed) return { ok: false, issues: ["처리방침 검토 완료를 확인해 주세요."] };
  return { ok: true, data: parsed.data };
}
export const EMPTY_IMAGE = { path: "", alt: "", focalX: 50, focalY: 50 };
export function getDocumentDefaults(key: string): DocumentBody {
  const sharedImage = { ...EMPTY_IMAGE };
  if (key === "home") return { ...SITE_CONTENT_SEED.home, image: sharedImage, sections: [], recommendations: [], blocks:[{key:"services",visible:true,sortOrder:0},{key:"recent",visible:true,sortOrder:1},{key:"recommendations",visible:true,sortOrder:2},{key:"additional",visible:true,sortOrder:3}] };
  if (key === "about") return { ...SITE_CONTENT_SEED.about, image: sharedImage, ctaLabel: "작업 사례 보기", ctaHref: "/portfolio" };
  if (key === "process") return { title: "확인부터 마무리까지", description: "현장에 맞는 범위를 확인하고 안전하게 작업합니다.", steps: SITE_CONTENT_SEED.processSteps.map((step) => ({ ...step, image: sharedImage })) };
  if (key === "policy") return { title: "개인정보처리방침", body: "개인정보 처리 목적, 항목, 보유 기간, 권리 행사 방법과 담당 연락처를 확인한 후 게시해 주세요.", effectiveDate: "2026-10-19", inquiryConsent: "문의 상담을 위한 이름, 연락처, 지역, 문의 내용 및 선택 사진의 수집·이용에 동의합니다.", reviewed: false };
  if (key === "settings") return { ...SITE_CONTENT_SEED.settings, representative:"", registrationNumber:"", logo: sharedImage, phone: "", address: "", hours: "", regions: [], email: "", socialHref: "", kakaoHref: "", seoTitle: "위생의 기술 | 천안·아산 청소", seoDescription: SITE_CONTENT_SEED.home.description, shareImage: sharedImage, headerCtaLabel: "문의하기", headerCtaHref: "/inquiry" };
  if (key === "pricing") return { lead: SITE_CONTENT_SEED.pricingLead, items: SITE_CONTENT_SEED.priceItems.map((item) => ({ ...item, unit: "", minPrice: null, maxPrice: null, inclusions: [], exclusions: [] })) };
  if (key === "faq") return { items: [{ id: "photo", question: "사진만으로 정확한 금액을 알 수 있나요?", answer: "사진은 범위를 파악하는 데 도움이 되지만, 현장 상태와 작업 가능 범위를 함께 확인해야 최종 안내가 가능합니다.", category: "pricing", serviceKey: "", visible: true, sortOrder: 0 }, { id: "case-price", question: "사례의 작업 가격은 왜 없나요?", answer: "당시 조건이 다른 가격을 현재 현장에 그대로 적용하는 오해를 막기 위해 개별 사례 가격을 공개하지 않습니다.", category: "pricing", serviceKey: "", visible: true, sortOrder: 1 }] };
  if (key.startsWith("service:")) { const service = SEED_SNAPSHOT.services.find((item) => item.key === key.slice(8)); if (service) return { key: service.key, name: service.name, summary: service.summary, description: service.description, coverAssetKey: service.coverAssetKey, active: service.active, sortOrder: service.sortOrder, image: sharedImage, inclusions: [], exclusions: [],scope:"",precautions:[],faqIds:[],caseIds:[] }; }
  if (key.startsWith("announcement:")) return { title: "새 공지사항", body: "공지 내용을 입력해 주세요.", image: sharedImage, images:[], pinned: false, status: "hidden" };
  return {};
}
export function compareDocument(before: unknown, after: unknown, prefix = ""): Array<{ path: string; before: unknown; after: unknown }> {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    const a = before as DocumentBody; const b = after as DocumentBody;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) => compareDocument(a[key], b[key], prefix ? `${prefix}.${key}` : key));
  }
  return [{ path: prefix || "문서", before, after }];
}
