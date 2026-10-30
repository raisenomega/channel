/**
 * HUB by Raisen — Fetcher de los tickets RESUELTOS (global del tenant) para el panel derecho de la
 * conversacion. Lee por el BACKEND (GET /api/conversation/resueltos, service-role): el frontend NO puede
 * leer activity_log directo (su RLS usa el claim top-level 'tenant_id', que vive en app_metadata = NULL).
 * Datos REALES: quien atendio + fecha + conversacion. C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";

export interface ResueltoRow { conversationId: string; consultaId: string; agentSlug: string; tipo: "cliente" | "consulta"; atendio: string; createdAt: string; label: string }

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

export interface HistorialPage { rows: ResueltoRow[]; total: number; page: number; pageSize: number }

// Historial COMPLETO paginado (18/pagina, desde el dia uno). Nunca se pierde ninguno.
export async function fetchHistorial(page: number): Promise<HistorialPage> {
  const vacio = { rows: [] as ResueltoRow[], total: 0, page, pageSize: 18 };
  try {
    const res = await apiFetch(`/api/conversation/resueltos/historial?page=${page}`);
    if (!res.ok) return vacio;
    const d = (await res.json()) as Partial<HistorialPage>;
    return { rows: d.rows ?? [], total: d.total ?? 0, page: d.page ?? page, pageSize: d.pageSize ?? 18 };
  } catch {
    return vacio;
  }
}
