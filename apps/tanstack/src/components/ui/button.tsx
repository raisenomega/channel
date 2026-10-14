import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "primary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  default: "bg-card-soft/60 text-foreground border border-border/45 hover:bg-card-soft/80 backdrop-blur-sm",
  primary: "bg-primary text-background hover:bg-primary-hover backdrop-blur-sm",
  outline: "border border-border/60 bg-transparent text-primary hover:border-primary/60",
  danger: "bg-transparent text-critical border border-critical/50 hover:bg-critical/10",
  ghost: "bg-transparent/10 text-muted-foreground hover:text-foreground hover:bg-card-soft/40 backdrop-blur-sm",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "default", size = "md", loading, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
          "transition-all select-none disabled:opacity-60 disabled:cursor-not-allowed",
          "active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring",
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...props}
      >
        {loading ? <LoadingIcon /> : null}
        {children}
      </button>
    );
  },
);

function LoadingIcon() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
