import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { ServicePage } from "@/features/portfolio/ui/service-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service: key } = await params;
  const service = SEED_SNAPSHOT.services.find((item) => item.key === key);
  if (!service) return {};
  return createPageMetadata({ title: service.name, description: service.summary, path: `/services/${service.key}` });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ service: string }> }) {
  const { service: key } = await params;
  const service = SEED_SNAPSHOT.services.find((item) => item.key === key);
  if (!service) notFound();
  return <ServicePage service={service} />;
}
