import { Suspense } from "react";
import { InterceptedQuickView } from "@/features/portfolio/ui/intercepted-quick-view";

export default async function QuickViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense fallback={null}><InterceptedQuickView slug={slug} /></Suspense>;
}
