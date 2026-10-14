import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        padded && "p-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-3 flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-base font-bold text-foreground", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}
