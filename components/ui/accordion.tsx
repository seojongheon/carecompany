"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = ({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) => <AccordionPrimitive.Item className={cn("border-b border-[var(--neutral-200)]", className)} {...props} />;
export const AccordionTrigger = ({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) => <AccordionPrimitive.Header><AccordionPrimitive.Trigger className={cn("group flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-semibold", className)} {...props}>{children}<ChevronDown aria-hidden="true" className="shrink-0 transition-transform group-data-[state=open]:rotate-180" size={20} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>;
export const AccordionContent = ({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) => <AccordionPrimitive.Content className={cn("overflow-hidden pb-4 text-[var(--neutral-700)]", className)} {...props} />;

