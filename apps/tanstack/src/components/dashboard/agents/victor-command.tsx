/**
 * HUB by Raisen — P3 JARVIS: CENTRO DE MANDO de Victor = la vista app-wide de TODOS los agentes (su funcion
 * es supervisar). Totales reales + comparacion por agente (barras) + tendencia global. Mide Sistema A, las
 * cotizaciones y los cierres de Sistema B. Cero sinteticos. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMetrics, type AgentMetric } from "@/hooks/useAgentMetrics";
import { AGENTS } from "./agent-roster";
import { MetricsBars } from "./metrics-bars";
import { MetricsTrend } from "./metrics-trend";

export function VictorCommand({ lang, accent }: { lang: Idioma; accent: string }) {
  const { agents, serie } = useAgentMetrics();
  const tot = (sel: (m?: AgentMetric) => number) => AGENTS.reduce((s, a) => s + sel(agents[a.code]), 0);
  const respuestas = tot((m) => m?.total ?? 0); const enviadas = tot((m) => m?.enviados ?? 0);
  const cotizaciones = tot((m) => m?.cotizaciones ?? 0); const cierres = tot((m) => m?.cierres ?? 0);
  const bars = AGENTS.map((a) => ({ name: t(lang, "agent.name." + a.code).slice(0, 6), v: agents[a.code]?.total ?? 0, color: `hsl(${a.accent})` }));
  const trend = serie.map((s) => ({ day: s.day, v: Object.values(s.counts).reduce((x, y) => x + y, 0) }));
  const kpi = (label: string, val: number, c: string) => <div className="rounded-lg bg-muted/20 p-2 text-center"><p className="text-[9px] uppercase text-muted-foreground">{label}</p><p className="text-2xl font-bold" style={{ color: c }}>{val}</p></div>;
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "am.command")} · {t(lang, "am.last14")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpi(t(lang, "am.responses"), respuestas, `hsl(${accent})`)}{kpi(t(lang, "am.sent"), enviadas, "hsl(var(--success))")}{kpi(t(lang, "am.quotes"), cotizaciones, "hsl(145 55% 42%)")}{kpi(t(lang, "am.closes"), cierres, "hsl(265 60% 60%)")}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border/40 bg-card-soft p-3"><p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "am.byAgent")}</p><MetricsBars data={bars} /></div>
        <MetricsTrend data={trend} accent={accent} label={t(lang, "am.appTrend")} />
      </div>
    </div>
  );
}
