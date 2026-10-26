/**
 * HUB by Raisen — P3 JARVIS: panel de metricas REALES de un agente (KPIs + tendencia 14d + radar de perfil
 * + lectura anticipada de tendencia). Datos de agent_drafts por persona. Cero sinteticos. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";
import { MetricsTrend } from "./metrics-trend";
import { MetricsRadar } from "./metrics-radar";

export function AgentMetrics({ lang, code, accent }: { lang: Idioma; code: string; accent: string }) {
  const { agents, serie } = useAgentMetrics();
  const m = agents[code] ?? { total: 0, aprobados: 0, enviados: 0, cotizaciones: 0, cierres: 0 };
  const tasa = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0;
  const trend = serie.map((s) => ({ day: s.day, v: s.counts[code] ?? 0 }));
  const prev7 = trend.slice(0, 7).reduce((s, x) => s + x.v, 0);
  const last7 = trend.slice(7).reduce((s, x) => s + x.v, 0);
  const dir = last7 > prev7 ? ["am.up", "hsl(var(--success))"] : last7 < prev7 ? ["am.down", "hsl(0 72% 55%)"] : ["am.flat", "hsl(var(--muted-foreground))"];
  const radar = ([["am.responses", m.total], ["am.approved", m.aprobados], ["am.sent", m.enviados], ["am.quotes", m.cotizaciones], ["am.closes", m.cierres]] as const).map(([k, v]) => ({ k: t(lang, k), v }));
  const kpi = (label: string, val: string) => <div className="rounded-lg bg-muted/20 p-2 text-center"><p className="text-[9px] uppercase text-muted-foreground">{label}</p><p className="text-xl font-bold" style={{ color: `hsl(${accent})` }}>{val}</p></div>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "am.last14")}</span>
        <span className="chip text-[10px] font-bold" style={{ color: dir[1], borderColor: dir[1] }}>{t(lang, "am.trendLabel")}: {t(lang, dir[0]!)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kpi(t(lang, "am.responses"), String(m.total))}{kpi(t(lang, "am.approved"), String(m.aprobados))}{kpi(t(lang, "am.sent"), String(m.enviados))}{kpi(t(lang, "am.quotes"), String(m.cotizaciones))}{kpi(t(lang, "am.closes"), String(m.cierres))}{kpi(t(lang, "am.rate"), `${tasa}%`)}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <MetricsTrend data={trend} accent={accent} label={t(lang, "am.trend")} />
        <div className="rounded-xl border border-border/40 bg-card-soft p-3"><p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "am.profile")}</p><MetricsRadar data={radar} accent={accent} /></div>
      </div>
    </div>
  );
}
