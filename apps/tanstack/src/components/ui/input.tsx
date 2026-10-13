import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, error, id, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-semibold text-muted-foreground">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground",
            "transition-colors placeholder:text-dim focus:border-primary focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-critical focus:border-critical",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-critical">{error}</p> : null}
      </div>
    );
  },
);
