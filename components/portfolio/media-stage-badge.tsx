import type { MediaStage } from "@/features/portfolio/model/types";

const labels = { before: "작업 전", after: "작업 후" } as const;

export function MediaStageBadge({ stage, className, testId }: { stage: MediaStage; className: string; testId: string }) {
  const label = stage === "before" || stage === "after" ? labels[stage] : null;
  if (!label) return null;
  return <span data-testid={testId} className={`absolute z-10 rounded-md bg-black/75 px-3 py-1.5 text-sm font-bold text-white shadow-lg backdrop-blur ${className}`}>{label}</span>;
}
