export interface HomeContent { eyebrow: string; title: string; description: string; primaryCtaLabel: string; primaryCtaHref: string; heroImageAlt: string; heroAssetKey: string; heroImageUrl?: string; heroImageStoragePath?: string; }
export interface PriceItem { id: string; serviceKey: string; name: string; priceLabel: string; conditions: string[]; visible: boolean; sortOrder: number; }
export interface ProcessStep { id: string; title: string; description: string; visible: boolean; sortOrder: number; }
export interface AboutContent { title: string; description: string; values: Array<{ id: string; title: string; description: string }>; }
export interface SiteSettings { businessName: string; footerDescription: string; contactLabel: string; contactHref: string; }
export interface SiteContent { home: HomeContent; pricingLead: string; priceItems: PriceItem[]; processSteps: ProcessStep[]; about: AboutContent; settings: SiteSettings; }
export interface SiteContentVersion { id: string; createdAt: string; content: SiteContent; }
export interface SiteContentSnapshot { draft: SiteContent; published: SiteContent; versions: SiteContentVersion[]; }
export type PublishContentResult = { ok: true } | { ok: false; issues: string[] };
