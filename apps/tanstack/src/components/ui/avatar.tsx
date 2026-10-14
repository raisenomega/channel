import { cn } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  dot?: "on" | "off";
}

const SIZE: Record<string, string> = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-lg",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function Avatar({ name, url, size = "md", dot }: AvatarProps) {
  const dotColor = dot === "on"
    ? "bg-success shadow-[0_0_6px] shadow-success/60"
    : "bg-low";

  return (
    <span className={cn("relative inline-flex shrink-0", SIZE[size])}>
      {url ? (
        <img
          src={url}
          alt={name}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center rounded-full font-bold text-background",
            "bg-primary",
          )}
        >
          {initials(name)}
        </span>
      )}
      {dot !== undefined ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-[14px] rounded-full border-2 border-card",
            dotColor,
          )}
        />
      ) : null}
    </span>
  );
}