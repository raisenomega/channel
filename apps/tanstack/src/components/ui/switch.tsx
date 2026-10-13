import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Switch({ checked = false, disabled, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-border/40",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-card shadow-sm",
          "transition-transform duration-150",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}