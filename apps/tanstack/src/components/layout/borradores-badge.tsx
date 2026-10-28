/**
 * HUB by Raisen — Badge rojo del chip Borradores: muestra el pendiente REAL (borradores visibles, sin
 * cotizaciones). Sube solo cuando un agente crea un borrador; baja al aprobar/denegar. Honesto. C4 <=75.
 */
import { AlertBadge } from "@/components/ui/alert-badge";
import { useDraftsPending } from "@/hooks/useDraftsPending";

export function BorradoresBadge() {
  const { visibleCount } = useDraftsPending();
  return <AlertBadge count={visibleCount} />;
}
