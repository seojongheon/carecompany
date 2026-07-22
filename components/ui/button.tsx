import { cloneElement, isValidElement } from "react";

import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "icon";
  asChild?: boolean;
};

export function Button({ className, variant = "primary", size = "default", asChild, children, ...props }: ButtonProps) {
  const styles = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]",
    variant === "secondary" && "border border-[var(--neutral-200)] bg-white text-[var(--neutral-900)] hover:bg-[var(--neutral-50)]",
    variant === "ghost" && "bg-transparent text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]",
    variant === "danger" && "bg-[var(--danger-600)] text-white",
    size === "default" && "px-5 py-2.5",
    size === "sm" && "min-h-11 px-3 py-2 text-sm",
    size === "icon" && "h-11 w-11 p-0",
    className,
  );
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, { className: cn(styles, children.props.className) });
  }
  return <button className={styles} {...props}>{children}</button>;
}
