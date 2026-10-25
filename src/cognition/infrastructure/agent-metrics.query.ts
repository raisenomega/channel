/**
 * HUB by Raisen — P3: metricas REALES por agente desde agent_drafts (persona_slug). Cuenta respuestas
 * generadas, aprobadas/enviadas, cotizaciones propuestas (scope=quote) y cierres (scope=strategic) por
 * cada persona. Service-role, filtro explicito por tenant. Cero sinteticos: lo que no hay sale en 0. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface AgentMetric { total: number; aprobados: number; enviados: number; cotizaciones: number; cierres: number; }

export async function metricasAgentes(tenantId: string): Promise<Record<string, AgentMetric>> {
  const { data } = await supabase.from("agent_drafts").select("persona_slug, status, metadata").eq("tenant_id", tenantId).limit(3000);
  const rows = (data ?? []) as Array<{ persona_slug?: string | null; status?: string | null; metadata?: { scope?: string } | null }>;
  const acc: Record<string, AgentMetric> = {};
  for (const r of rows) {
    const k = r.persona_slug || "?";
    const m = (acc[k] ??= { total: 0, aprobados: 0, enviados: 0, cotizaciones: 0, cierres: 0 });
    m.total++;
    if (r.status === "approved" || r.status === "sent") m.aprobados++;
    if (r.status === "sent") m.enviados++;
    if (r.metadata?.scope === "quote") m.cotizaciones++;
    if (r.metadata?.scope === "strategic") m.cierres++;
  }
  return acc;
}
