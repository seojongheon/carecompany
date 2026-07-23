import { ClientCaseRoute } from "@/features/portfolio/ui/client-case-route";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicCaseBySlugFromServer } from "@/features/portfolio/repository/public-case-server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicCaseBySlugFromServer(slug);
  if (!item) return { title: "페이지를 찾을 수 없습니다", robots: { index: false, follow: false } };
  return createPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.summary, path: `/portfolio/${item.slug}` });
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublicCaseBySlugFromServer(slug);
  if (!item) notFound();
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "전체 작업 사례", item: "/portfolio" }, { "@type": "ListItem", position: 2, name: item.title, item: `/portfolio/${item.slug}` }] },
      { "@type": "Article", headline: item.title, description: item.summary, datePublished: item.publishedAt },
    ],
  }).replace(/</g, "\\u003c");
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} /><ClientCaseRoute slug={slug} initialDetail={item} /></>;
}
