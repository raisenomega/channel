/**
 * HUB by Raisen — Cuenta consultas de agente + escaladas de cliente SIN atender (sin fila resolved que
 * las cierre). Alimenta la palabra ALERTA (parpadeo) de la tarjeta Actividad Reciente. Service-role.
 * C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function contarPendientes(tenantId: string): Promise<number> {
  try {
    const { data } = await supabase.from("activity_log").select("event_type, metadata").eq("tenant_id", tenantId).in("event_type", ["consulta", "escalation", "resolved"]).order("created_at", { ascending: false }).limit(500);
    const resueltoConsulta = new Set<string>();
    const resueltoConv = new Set<string>();
    const consultas = new Set<string>();
    const escaladas: Array<{ cId: string; conv: string }> = [];
    for (const r of (data ?? []) as Array<{ event_type?: string; metadata?: { consultaId?: string; conversationId?: string } | null }>) {
      const m = r.metadata ?? {};
      if (r.event_type === "resolved") { if (m.consultaId) resueltoConsulta.add(m.consultaId); if (m.conversationId) resueltoConv.add(m.conversationId); }
      else if (r.event_type === "consulta") { if (m.consultaId) consultas.add(m.consultaId); }
      else if (r.event_type === "escalation") escaladas.push({ cId: String(m.consultaId ?? ""), conv: String(m.conversationId ?? "") });
    }
    let n = 0;
    for (const id of consultas) if (!resueltoConsulta.has(id)) n++;
    // Escalada CERRADA si hay resolved por su consultaId O por su conversationId (legado via flujo cliente).
    // Dedup por conversacion (o consultaId si no tiene): varias escaladas del mismo hilo = 1 alerta, no N.
    const vistas = new Set<string>();
    for (const e of escaladas) {
      const key = e.conv || e.cId; if (!key || vistas.has(key)) continue; vistas.add(key);
      if (!((e.cId && resueltoConsulta.has(e.cId)) || (e.conv && resueltoConv.has(e.conv)))) n++;
    }
    return n;
  } catch {
    return 0;
  }
}
