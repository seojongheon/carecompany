import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-28 w-full rounded-xl border border-[var(--neutral-200)] bg-white px-3 py-2 aria-[invalid=true]:border-[var(--danger-600)]", className)} {...props} />;
}

