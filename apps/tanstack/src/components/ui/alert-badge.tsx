/**
 * HUB by Raisen — Badge de notificación reutilizable: círculo rojo con el número de no-leídos de `keyName`.
 * Se oculta solo si el contador es 0. Úsalo en cualquier chip/ítem: <AlertBadge keyName="channel:whatsapp" />,
 * "status:pending", "crm:orders", etc. Alimentado por el AlertsProvider (Realtime).
 */
import { useAlertCount } from "@/lib/alerts/alerts-context";
import { cn } from "@/lib/utils";

export function AlertBadge({ keyName, className }: { keyName: string; className?: string }) {
  const n = useAlertCount(keyName);
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-critical px-1 text-[0.65rem] font-bold leading-none text-white",
        className,
      )}
      aria-label={`${n} nuevos sin leer`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
