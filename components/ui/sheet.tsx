"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export function SheetContent({ className, children, side = "right", ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "left" | "right" }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" /><DialogPrimitive.Content className={cn("fixed inset-y-0 z-50 w-[min(88vw,390px)] overflow-y-auto bg-white p-6 shadow-2xl", side === "right" ? "right-0" : "left-0", className)} {...props}>{children}<DialogPrimitive.Close aria-label="닫기" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full"><X aria-hidden="true" /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}

