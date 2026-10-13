import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
}

export interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-selected={active}
            className={cn(
              "flex-1 rounded-lg px-1 py-1.5 text-center text-xs",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
