/**
 * HUB by Raisen — P3: panel de metricas REALES de un agente (desde agent_drafts por persona). Lo que no hay
 * sale en 0 (cero sinteticos). Se muestra en la pestana "Metricas" de cada agente. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";

export function AgentMetrics({ lang, code, accent }: { lang: Idioma; code: string; accent: string }) {
  const metrics = useAgentMetrics();
  const m = metrics[code] ?? { total: 0, aprobados: 0, enviados: 0, cotizaciones: 0, cierres: 0 };
  const tasa = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0;
  const kpi = (label: string, val: string) => (
    <div className="rounded-lg bg-muted/20 p-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-bold" style={{ color: `hsl(${accent})` }}>{val}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {kpi(t(lang, "am.responses"), String(m.total))}
      {kpi(t(lang, "am.approved"), String(m.aprobados))}
      {kpi(t(lang, "am.sent"), String(m.enviados))}
      {kpi(t(lang, "am.quotes"), String(m.cotizaciones))}
      {kpi(t(lang, "am.closes"), String(m.cierres))}
      {kpi(t(lang, "am.rate"), `${tasa}%`)}
    </div>
  );
}
