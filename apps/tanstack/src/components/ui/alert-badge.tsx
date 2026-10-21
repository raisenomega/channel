/**
 * HUB by Raisen — Badge de notificación reutilizable: círculo rojo con un número.
 * Dos modos (se oculta solo si es 0):
 *  - por CLAVE: <AlertBadge keyName="channel:whatsapp" /> lee del AlertsProvider (no-leídos desde que abriste).
 *  - directo:  <AlertBadge count={3} /> para un conteo real que ya tienes a mano (ej. estados del inbox).
 */
import { useAlertCount } from "@/lib/alerts/alerts-context";
import { cn } from "@/lib/utils";

export function AlertBadge({ keyName, count, className }: { keyName?: string; count?: number; className?: string }) {
  const fromCtx = useAlertCount(keyName ?? ""); // hook incondicional (clave vacía -> 0)
  const n = count ?? fromCtx;
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-critical px-1 text-[0.65rem] font-bold leading-none text-white",
        className,
      )}
      aria-label={`${n} sin leer`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
