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

// Historial COMPLETO paginado (desde el dia uno). Nunca se pierde ninguno. size = filas por pagina
// (18 en la pagina /historial; 12 en el modal de la conversacion para que no pase abajo de pantalla).
export async function fetchHistorial(page: number, size = 18): Promise<HistorialPage> {
  const vacio = { rows: [] as ResueltoRow[], total: 0, page, pageSize: size };
  try {
    const res = await apiFetch(`/api/conversation/resueltos/historial?page=${page}&size=${size}`);
    if (!res.ok) return vacio;
    const d = (await res.json()) as Partial<HistorialPage>;
    return { rows: d.rows ?? [], total: d.total ?? 0, page: d.page ?? page, pageSize: d.pageSize ?? size };
  } catch {
    return vacio;
  }
}
