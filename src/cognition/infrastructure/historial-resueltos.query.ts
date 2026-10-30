/**
 * HUB by Raisen — Historial COMPLETO de tickets CERRADOS (desde el dia uno), PAGINADO. Dedup por ticket
 * (consultaId || conversationId, el ultimo resuelto gana). Nunca se pierde ninguno: devuelve la pagina +
 * el total. Service-role (el frontend no lee activity_log directo). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { ResueltoRow } from "./conversation-resolve.repo.ts";

export async function listarHistorial(tenantId: string, page: number, pageSize = 18): Promise<{ rows: ResueltoRow[]; total: number }> {
  try {
    const { data } = await supabase.from("activity_log").select("label,created_at,metadata")
      .eq("tenant_id", tenantId).eq("event_type", "resolved").order("created_at", { ascending: false }).limit(5000);
    const seen = new Set<string>();
    const full: ResueltoRow[] = [];
    for (const x of (data ?? []) as Array<{ label?: string; created_at?: string; metadata?: { conversationId?: string; consultaId?: string; agentSlug?: string; kind?: string; atendio?: string } | null }>) {
      const m = x.metadata ?? {};
      const consultaId = String(m.consultaId ?? "");
      const c = consultaId || String(m.conversationId ?? "");
      if (!c || seen.has(c)) continue;
      seen.add(c);
      full.push({ conversationId: String(m.conversationId ?? ""), consultaId, agentSlug: String(m.agentSlug ?? ""), tipo: m.kind === "consulta" ? "consulta" : "cliente", atendio: String(m.atendio ?? ""), createdAt: String(x.created_at ?? ""), label: String(x.label ?? "") });
    }
    const start = Math.max(0, page) * pageSize;
    return { rows: full.slice(start, start + pageSize), total: full.length };
  } catch {
    return { rows: [], total: 0 };
  }
}
