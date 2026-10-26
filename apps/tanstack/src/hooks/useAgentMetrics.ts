/**
 * HUB by Raisen — P3: metricas reales (totales por agente + serie diaria 14d) para los paneles JARVIS.
 * Lee el endpoint del backend (service-role, tenant del claim). Vacio honesto sin tenant/red.
 */
import { useState, useEffect } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface AgentMetric { total: number; aprobados: number; enviados: number; cotizaciones: number; cierres: number; }
export interface MetricsData { agents: Record<string, AgentMetric>; serie: Array<{ day: string; counts: Record<string, number> }>; }

const VACIO: MetricsData = { agents: {}, serie: [] };

export function useAgentMetrics(): MetricsData {
  const [m, setM] = useState<MetricsData>(VACIO);
  useEffect(() => {
    const tid = resolveTenantId();
    if (!tid) return;
    void apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/metrics`)
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { metrics?: MetricsData }; setM(j.metrics ?? VACIO); } })
      .catch(() => { /* vacio honesto */ });
  }, []);
  return m;
}
