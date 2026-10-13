/**
 * HUB by Raisen — Render de metricas del agente.
 * Solo pinta datos reales (view "ready"); vacio/loading son estados honestos
 * (P1/N5). No inventa porcentajes.
 */
import { t, type Idioma } from "./i18n.ts";
import type { AgentMetricsView } from "./agent-metrics-client.ts";

export function renderMetricasAgente(vista: AgentMetricsView, lang: Idioma): string {
  if (vista.status === "loading") return bloque(t(lang, "agent.metricsLoading"));
  if (vista.status === "error") return bloque(t(lang, "agent.metricsError"));
  if (vista.status === "empty") return bloque(t(lang, "agent.noDataTitle"), t(lang, "agent.noDataBody"));
  const m = vista.metrics;
  return `
    <div class="agmetrics grid grid-cols-3 gap-sm" style="margin-top:14px">
      <div class="am"><b>${pct(m.wasCorrectRate)}</b><small>${t(lang, "agent.wasCorrect")}</small></div>
      <div class="am"><b>${pct(m.indistinguishability)}</b><small>${t(lang, "agent.indistinguishability")}</small></div>
      <div class="am"><b>${pct(m.autonomousRate)}</b><small>${t(lang, "agent.autoResolve")}</small></div>
    </div>
    <div class="section text-sm font-bold text-muted">${t(lang, "agent.qualityMetrics")}</div>
    <div class="kpis grid grid-cols-2 gap">
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.wasCorrect")}</div><div class="kpi-value" style="color:var(--good)">${pct(m.wasCorrectRate)}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.indistinguishability")}</div><div class="kpi-value" style="color:var(--hub)">${pct(m.indistinguishability)}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.autoResolve")}</div><div class="kpi-value">${pct(m.autonomousRate)}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.totalInteractions")}</div><div class="kpi-value">${m.totalInteractions}</div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.latency")}</div><div class="kpi-value">${m.avgLatencyMs !== null ? `${m.avgLatencyMs}<small>ms</small>` : dash()}</div></div>
    </div>`;
}

function pct(v: number | null): string {
  return v !== null ? `${v}%` : dash();
}

function dash(): string {
  return "\u2014";
}

function bloque(titulo: string, cuerpo?: string): string {
  const body = cuerpo ? `<p class="text-sm text-muted" style="margin:4px 0 0">${cuerpo}</p>` : "";
  return `<div style="margin-top:14px">
      <div class="am"><b style="font-size:14px">${titulo}</b></div>${body}
    </div>`;
}