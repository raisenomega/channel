import { cn } from "@/lib/utils";

export interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function Kpi({ label, value, hint, className }: KpiProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/45 bg-card p-3.5",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {value}
        {hint ? <small className="ml-1 text-xs font-semibold text-dim">{hint}</small> : null}
      </p>
    </div>
  );
}
