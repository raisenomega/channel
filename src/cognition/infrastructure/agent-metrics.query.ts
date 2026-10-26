/**
 * HUB by Raisen — P3: metricas REALES por agente desde agent_drafts (persona_slug). Totales por persona
 * (respuestas/aprobadas/enviadas/cotizaciones scope=quote/cierres scope=strategic) + SERIE diaria de 14 dias
 * (actividad por persona por dia) para las graficas de tendencia. Service-role, filtro por tenant. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface AgentMetric { total: number; aprobados: number; enviados: number; cotizaciones: number; cierres: number; }
export interface MetricsResult { agents: Record<string, AgentMetric>; serie: Array<{ day: string; counts: Record<string, number> }>; }

const DIA = 86400000;

export async function metricasAgentes(tenantId: string): Promise<MetricsResult> {
  const desde = new Date(Date.now() - 14 * DIA).toISOString();
  const { data } = await supabase.from("agent_drafts").select("persona_slug, status, metadata, created_at").eq("tenant_id", tenantId).gte("created_at", desde).limit(5000);
  const rows = (data ?? []) as Array<{ persona_slug?: string | null; status?: string | null; metadata?: { scope?: string } | null; created_at?: string | null }>;
  const agents: Record<string, AgentMetric> = {};
  const porDia: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const k = r.persona_slug || "?";
    const m = (agents[k] ??= { total: 0, aprobados: 0, enviados: 0, cotizaciones: 0, cierres: 0 });
    m.total++;
    if (r.status === "approved" || r.status === "sent") m.aprobados++;
    if (r.status === "sent") m.enviados++;
    if (r.metadata?.scope === "quote") m.cotizaciones++;
    if (r.metadata?.scope === "strategic") m.cierres++;
    const d = (r.created_at ?? "").slice(5, 10); // MM-DD
    if (d) ((porDia[d] ??= {})[k] = (porDia[d][k] ?? 0) + 1);
  }
  const serie = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * DIA).toISOString().slice(5, 10); return { day: d, counts: porDia[d] ?? {} }; });
  return { agents, serie };
}
