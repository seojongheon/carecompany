import type { Metadata } from "next";
import { getPublishedContent } from "@/features/site-content/server/public-content";
import { AnalyticsConsent } from "@/features/analytics/ui/analytics-consent";
import { EstimateFab } from "@/components/site/estimate-fab";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export async function generateMetadata(): Promise<Metadata> {
 const {settings}=await getPublishedContent();
 const image=settings.shareImage as {url?:string}|undefined;
 return {title:{default:settings.seoTitle||settings.businessName,template:`%s | ${settings.businessName}`},description:settings.seoDescription||settings.footerDescription,openGraph:{title:settings.seoTitle||settings.businessName,description:settings.seoDescription||settings.footerDescription,locale:"ko_KR",type:"website",...(image?.url?{images:[image.url]}:{})}};
}

export default function SiteLayout({ children, modal }: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return <><Header />{children}<Footer /><AnalyticsConsent /><EstimateFab />{modal}</>;
}

