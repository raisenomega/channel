/**
 * HUB by Raisen — P3: metricas reales por agente (respuestas/aprobadas/enviadas/cotizaciones/cierres).
 * Lee el endpoint del backend (service-role, tenant del claim). Vacio honesto sin tenant/red.
 */
import { useState, useEffect } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface AgentMetric { total: number; aprobados: number; enviados: number; cotizaciones: number; cierres: number; }

export function useAgentMetrics(): Record<string, AgentMetric> {
  const [m, setM] = useState<Record<string, AgentMetric>>({});
  useEffect(() => {
    const tid = resolveTenantId();
    if (!tid) return;
    void apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/metrics`)
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { metrics?: Record<string, AgentMetric> }; setM(j.metrics ?? {}); } })
      .catch(() => { /* vacio honesto */ });
  }, []);
  return m;
}
