/**
 * HUB by Raisen — Paneles REALES "Que esta logrando" / "Que identifica" por agente, derivados de las
 * metricas vivas (/agents/metrics, de agent_drafts). Cero sinteticos; vacio honesto sin actividad. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";

const VACIO = { total: 0, aprobados: 0, enviados: 0, cotizaciones: 0, cierres: 0 };

export function AgentOutcome({ lang, code, accent, mode }: { lang: Idioma; code: string; accent: string; mode: "achieves" | "identifies" }) {
  const { agents } = useAgentMetrics();
  const m = agents[code] ?? VACIO;
  const tasa = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0;
  const esLogra = mode === "achieves";
  const vacio = esLogra ? m.total === 0 : m.total === 0 && m.cotizaciones === 0 && m.cierres === 0;
  if (vacio) return <p className="text-sm text-muted-foreground">{t(lang, esLogra ? "ag.out.achEmpty" : "ag.out.idEmpty")}</p>;
  const lead = esLogra
    ? t(lang, "ag.out.achLead", { n: m.total, ap: m.aprobados, c: m.cierres })
    : t(lang, "ag.out.idLead", { n: m.total, q: m.cotizaciones, o: m.cierres });
  const kpis: Array<[string, string]> = esLogra
    ? [["am.approved", String(m.aprobados)], ["am.sent", String(m.enviados)], ["am.closes", String(m.cierres)], ["am.rate", `${tasa}%`]]
    : [["ag.out.detected", String(m.total)], ["ag.out.intent", String(m.cotizaciones)], ["ag.out.opps", String(m.cierres)]];
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{lead}</p>
      <div className={"grid gap-2 " + (esLogra ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/20 p-2 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">{t(lang, k)}</p>
            <p className="text-xl font-bold" style={{ color: `hsl(${accent})` }}>{v}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{t(lang, "am.last14")}</p>
    </div>
  );
}
