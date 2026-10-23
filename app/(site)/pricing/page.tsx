import { PricingSections } from "@/components/site/pricing-sections";
import { getPublishedContent } from "@/features/site-content/server/public-content";
import { createPageMetadata } from "@/lib/metadata";
export async function generateMetadata(){const content=await getPublishedContent();return createPageMetadata({title:"가격 안내",description:content.pricingLead,path:"/pricing"});}
export default function PricingPage() { return <PricingSections />; }
