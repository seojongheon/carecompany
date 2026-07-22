import type { Metadata } from "next";

export const portfolioImageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export function shouldPrioritizeImage(index: number) {
  return index === 0;
}

export function createPageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", locale: "ko_KR", url: path },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path,
    })),
  } as const;
}

