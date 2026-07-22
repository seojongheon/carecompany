import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import type { MutationState } from "@/features/portfolio/repository/portfolio-provider";

export function AutosaveStatus({ state, message }: { state: MutationState; message: string | null }) {
  const Glyph = state === "saving" ? LoaderCircle : state === "failed" ? TriangleAlert : CheckCircle2;
  if (state === "idle") return <span className="text-sm text-[var(--neutral-500)]">변경하면 자동 저장됩니다.</span>;
  return <span role={state === "failed" ? "alert" : "status"} className="inline-flex items-center gap-2 text-sm font-semibold"><Glyph aria-hidden="true" size={17} className={state === "saving" ? "animate-spin" : ""} />{message}</span>;
}

