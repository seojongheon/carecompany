import type { CaseMedia } from "@/features/portfolio/model/types";
import { GalleryGrid } from "./gallery-grid";

export function BeforeAfter({ before, after }: { before: CaseMedia[]; after: CaseMedia[] }) {
  return <div className="grid gap-8 lg:grid-cols-2"><section><h2 className="mb-4 text-2xl font-black">작업 전</h2><GalleryGrid media={before} eagerFirst /></section><section><h2 className="mb-4 text-2xl font-black">작업 후</h2><GalleryGrid media={after} /></section></div>;
}
