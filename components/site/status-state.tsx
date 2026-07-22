import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function StatusState({ kind, title, description, actionLabel, onAction }: {
  kind: "loading" | "empty" | "error";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Glyph = kind === "loading" ? LoaderCircle : kind === "empty" ? Inbox : AlertCircle;
  return <div role={kind === "error" ? "alert" : "status"} className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[var(--neutral-200)] bg-[var(--neutral-50)] p-8 text-center"><div><Glyph aria-hidden="true" className={kind === "loading" ? "mx-auto mb-3 animate-spin" : "mx-auto mb-3"} /><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-[var(--neutral-500)]">{description}</p>{actionLabel && onAction ? <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}</div></div>;
}

