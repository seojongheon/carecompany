"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => <TabsPrimitive.List className={cn("inline-flex min-h-11 items-center gap-1 rounded-xl bg-[var(--neutral-100)] p-1", className)} {...props} />;
export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => <TabsPrimitive.Trigger className={cn("min-h-10 rounded-lg px-4 font-semibold text-[var(--neutral-500)] data-[state=active]:bg-white data-[state=active]:text-[var(--neutral-900)] data-[state=active]:shadow-sm", className)} {...props} />;
export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn("mt-5", className)} {...props} />;

