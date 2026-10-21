/**
 * HUB by Raisen — Sistema de alertas/notificaciones (núcleo reutilizable).
 * Contadores por CLAVE libre (channel:whatsapp, status:pending, crm:orders, ...). Cualquier parte
 * de la app solo consume `useAlertCount(clave)` + `useMarkRead()`; el provider alimenta los números
 * desde Realtime. Añadir una fuente nueva = registrar tabla->clave en el provider (cero cableado UI).
 */
import { createContext, useContext } from "react";

export interface AlertsApi {
  readonly counts: Readonly<Record<string, number>>;
  readonly bump: (key: string) => void; // uso interno del provider
  readonly markRead: (key: string) => void; // pone la clave a 0 (p.ej. al abrir el hilo/canal)
}

const NOOP: AlertsApi = { counts: {}, bump: () => {}, markRead: () => {} };

export const AlertsContext = createContext<AlertsApi | null>(null);

export function useAlerts(): AlertsApi {
  return useContext(AlertsContext) ?? NOOP;
}

/** Número de no-leídos de una clave (0 si no hay). */
export function useAlertCount(key: string): number {
  return useAlerts().counts[key] ?? 0;
}

/** Limpia una clave (badge a 0). */
export function useMarkRead(): (key: string) => void {
  return useAlerts().markRead;
}
