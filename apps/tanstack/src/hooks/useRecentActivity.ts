/**
 * HUB by Raisen — Hook: polling 10s de últimos 5 eventos de actividad.
 */
import { useState, useEffect, useCallback } from "react";
import type { ActivityEvent } from "@/components/dashboard/bentobox/bento-actividad-reciente";

export function useRecentActivity(): { events: readonly ActivityEvent[] } {
  const [events, setEvents] = useState<readonly ActivityEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants/mine/activity/recent");
      if (res.ok) {
        const data = (await res.json()) as { events: ActivityEvent[] };
        setEvents(data.events ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 10_000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return { events };
}