import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublishedServices } from "@/features/site-content/server/public-content";
import { PublishedService } from "@/features/site-content/ui/published-service";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service: key } = await params;
  const service = (await getPublishedServices()).find((item) => item.key === key && item.active);
  if (!service) return {};
  return createPageMetadata({ title: service.name, description: service.summary, path: `/services/${service.key}` });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ service: string }> }) {
  const { service: key } = await params;
  const service = (await getPublishedServices()).find((item) => item.key === key && item.active);
  if (!service) notFound();
  return <PublishedService service={service} />;
}
