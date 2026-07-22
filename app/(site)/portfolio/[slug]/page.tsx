import { ClientCaseRoute } from "@/features/portfolio/ui/client-case-route";
import type { Metadata } from "next";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = SEED_SNAPSHOT.cases.find((entry) => entry.slug === slug && entry.status === "published");
  if (!item) return { title: "페이지를 찾을 수 없습니다", robots: { index: false, follow: false } };
  return createPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.summary, path: `/portfolio/${item.slug}` });
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = SEED_SNAPSHOT.cases.find((entry) => entry.slug === slug && entry.status === "published");
  const structuredData = item ? JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "전체 작업 사례", item: "/portfolio" }, { "@type": "ListItem", position: 2, name: item.title, item: `/portfolio/${item.slug}` }] },
      { "@type": "Article", headline: item.title, description: item.summary, datePublished: item.publishedAt },
    ],
  }).replace(/</g, "\\u003c") : null;
  return <>{structuredData ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} /> : null}<ClientCaseRoute slug={slug} /></>;
}
