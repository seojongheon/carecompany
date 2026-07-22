import type { LucideIcon } from "lucide-react";

export function Icon({ icon: Glyph, label, ...props }: { icon: LucideIcon; label?: string } & React.ComponentProps<LucideIcon>) {
  return <Glyph aria-hidden={label ? undefined : "true"} aria-label={label} {...props} />;
}

