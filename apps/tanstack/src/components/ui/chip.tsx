import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ className, active, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/45 bg-card-soft/60 px-3 py-1.5",
        "text-sm text-foreground backdrop-blur-sm transition-colors hover:border-primary",
        active && "border-primary bg-primary/15 text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
