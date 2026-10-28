/**
 * HUB by Raisen — Fetcher de los tickets RESUELTOS (global del tenant) para el panel derecho de la
 * conversacion. Lee por el BACKEND (GET /api/conversation/resueltos, service-role): el frontend NO puede
 * leer activity_log directo (su RLS usa el claim top-level 'tenant_id', que vive en app_metadata = NULL).
 * Datos REALES: quien atendio + fecha + conversacion. C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";

export interface ResueltoRow { conversationId: string; atendio: string; createdAt: string; label: string }

export async function fetchTicketsResueltos(): Promise<ResueltoRow[]> {
  try {
    const res = await apiFetch("/api/conversation/resueltos");
    if (!res.ok) return [];
    const data = (await res.json()) as { rows?: ResueltoRow[] };
    return data.rows ?? [];
  } catch {
    return [];
  }
}
