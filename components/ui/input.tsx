import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-xl border border-[var(--neutral-200)] bg-white px-3 py-2 aria-[invalid=true]:border-[var(--danger-600)]", className)} {...props} />;
}

