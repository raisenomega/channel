/**
 * HUB by Raisen — Grid de KPIs del Agente IA.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { AgentMetrics } from "@/lib/types";
import { Kpi } from "@/components/ui/kpi";

export function KpiGrid({ metrics, language }: { metrics: AgentMetrics; language: Idioma }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label={t(language, "agent.wasCorrect")} value={metrics.wasCorrectPct !== null ? `${metrics.wasCorrectPct.toFixed(1)}%` : "—"} />
      <Kpi label={t(language, "agent.indistinguishability")} value={metrics.indistinguishabilityPct !== null ? `${metrics.indistinguishabilityPct.toFixed(1)}%` : "—"} />
      <Kpi label={t(language, "agent.autoResolve")} value={metrics.autoResolvePct !== null ? `${metrics.autoResolvePct.toFixed(1)}%` : "—"} />
      <Kpi label={t(language, "agent.latency")} value={metrics.avgLatencyMs !== null ? `${metrics.avgLatencyMs.toFixed(0)}ms` : "—"} />
    </div>
  );
}