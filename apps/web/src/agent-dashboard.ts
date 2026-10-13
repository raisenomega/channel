import { lucide } from "@shared/domain/lucide-icons.ts";
import type { OperationMode } from "./types.ts";
import { t, type Idioma } from "./i18n.ts";

export function renderAgentDashboard(
  wasCorrect: number,
  indistinguishability: number,
  autoRate: number,
  latency: string,
  providerName: string,
  modelName: string,
  byokConfigured: boolean,
  fallbackProvider: string | null,
  mode: OperationMode,
  lang: Idioma,
): string {
  const modeName = t(lang, `common.${mode}`);
  return `<div class="view">
    <div class="brain">
      <div class="row1 flex items-center gap-sm">
        <div class="glyph">${lucide("agent", { size: 22, color: "var(--agent)" })}</div>
        <h3>${t(lang, "agent.title")} ${modeName}
          <span class="block text-xs" style="color:#9FB4C4">${t(lang, "agent.providerLine")}: ${providerName} · ${t(lang, "agent.model")}: ${modelName}</span>
        </h3>
      </div>
      <div class="agmetrics grid grid-cols-3 gap-sm" style="margin-top:14px">
        <div class="am"><b>${wasCorrect}%</b><small>${t(lang, "agent.wasCorrect")}</small></div>
        <div class="am"><b>${indistinguishability}%</b><small>${t(lang, "agent.indistinguishability")}</small></div>
        <div class="am"><b>${autoRate}%</b><small>${t(lang, "agent.autoResolve")}</small></div>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted" style="margin-top:16px">${t(lang, "agent.qualityMetrics")}</div>
    <div class="kpis grid grid-cols-2 gap">
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.wasCorrect")}</div><div class="kpi-value" style="color:var(--good)">${wasCorrect}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.indistinguishability")}</div><div class="kpi-value" style="color:var(--hub)">${indistinguishability}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.autoResolve")}</div><div class="kpi-value">${autoRate}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">${t(lang, "agent.latency")}</div><div class="kpi-value">${latency}</div></div>
    </div>
    <div class="section text-sm font-bold text-muted">${t(lang, "agent.providerConfig")}</div>
    <div class="card" style="background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px">
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">${t(lang, "agent.activeProvider")}</span>
        <span class="text-hub font-bold">${providerName}</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">${t(lang, "agent.byok")}</span>
        <span class="text-hub" style="color:var(--hub-deep)">${byokConfigured ? t(lang, "agent.byokTenant") : t(lang, "agent.byokRaisen")}</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0">
        <span class="text-muted">${t(lang, "agent.fallback")}</span>
        <span class="text-hub" style="color:var(--hub-deep)">${fallbackProvider ?? t(lang, "agent.fallbackNone")}</span>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted">${t(lang, "agent.autonomy")}</div>
    <div class="card" style="padding:12px">
      <div class="feat flex items-center gap-sm">
        <div class="switch on"><i></i></div>
        <span>${t(lang, "agent.outOfHours")}</span>
      </div>
      <div class="feat flex items-center gap-sm">
        <div class="switch on"><i></i></div>
        <span>${t(lang, "agent.frequentInHours")}</span>
      </div>
      <div class="feat flex items-center gap-sm">
        <div class="switch off"><i></i></div>
        <span>${t(lang, "agent.quotesOrders")}</span>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted">${t(lang, "agent.alwaysEscalate")}</div>
    <div class="list">
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">${t(lang, "agent.complaint")}</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">${t(lang, "agent.vip")}</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">${t(lang, "agent.amountThreshold")}</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">${t(lang, "agent.legal")}</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">${t(lang, "agent.askHuman")}</span></div>
    </div>
  </div>`;
}