import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "hub" | "success" | "danger" | "warn" | "process";

const TONE: Record<BadgeTone, string> = {
  hub: "bg-primary/80 text-background backdrop-blur-sm",
  success: "bg-success/15 text-foreground border border-success/40 backdrop-blur-sm",
  danger: "bg-critical/15 text-foreground border border-critical/45 backdrop-blur-sm",
  warn: "bg-medium/15 text-foreground border border-medium/45 backdrop-blur-sm",
  process: "bg-process/15 text-foreground border border-process/40 backdrop-blur-sm",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ className, tone = "hub", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
