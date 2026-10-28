/**
 * HUB by Raisen — Hook: polling 10s de últimos 5 eventos de actividad.
 * Hotfix G: apiFetch con JWT + tenantId real (antes "/tenants/mine" literal sin auth -> 401/403).
 */
import { useState, useEffect, useCallback } from "react";
import type { ActivityEvent } from "@/components/dashboard/bentobox/bento-actividad-reciente";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export function useRecentActivity(): { events: readonly ActivityEvent[]; alertas: number } {
  const [events, setEvents] = useState<readonly ActivityEvent[]>([]);
  const [alertas, setAlertas] = useState(0);

  const fetchEvents = useCallback(async () => {
    const tenantId = resolveTenantId();
    if (!tenantId) return;
    try {
      const res = await apiFetch(`/tenants/${encodeURIComponent(tenantId)}/activity/recent`);
      if (res.ok) {
        const data = (await res.json()) as { events: ActivityEvent[]; alertas?: number };
        setEvents(data.events ?? []);
        setAlertas(data.alertas ?? 0);
      }
    } catch { /* sin sesion o red: lista vacia honesta */ }
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 10_000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return { events, alertas };
}
