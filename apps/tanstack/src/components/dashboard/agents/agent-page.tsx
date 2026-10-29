/**
 * HUB by Raisen — Pantalla de un agente (los 6, sin chat): centro de mando igual que Victor. En la
 * linea del cargo, chips de accion (Que hace/logra/identifica/metricas/que necesita mejorar); clic
 * muestra ese panel. Contenido comercial; datos vivos = vacio honesto hasta el backend. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { type AgentDef, SECS, secBody } from "./agent-roster";
import { AgentAvatar } from "./agent-avatar";
import { AgentMetrics } from "./agent-metrics";
import { AgentOutcome } from "./agent-outcome";

export function AgentPage({ lang, agent, online }: { lang: Idioma; agent: AgentDef; online: boolean }) {
  const [tab, setTab] = useState(0);
  const name = t(lang, "agent.name." + agent.code);
  const sec = SECS[tab] ?? SECS[0]!;
  return (
    <div className="space-y-3">
      <header className="flex items-start gap-3">
        <AgentAvatar name={name} accent={agent.accent} src={`/agents/${agent.code}.png`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: online ? "hsl(var(--success))" : "hsl(var(--text-dim))" }} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold" style={{ color: `hsl(${agent.accent})` }}>{t(lang, `ag.${agent.code}.pos`)}</span>
            {SECS.map((s, i) => (
              <button key={s.k} type="button" onClick={() => setTab(i)} className={"chip text-[11px]" + (tab === i ? " active" : "")} style={tab === i ? { color: `hsl(${agent.accent})`, borderColor: `hsl(${agent.accent})` } : undefined}>{t(lang, s.label)}</button>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, `ag.${agent.code}.obj`)}</p>
        </div>
      </header>
      <div className="min-h-[180px] rounded-xl border border-border/40 bg-card-soft p-4">
        <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, sec.label)}</p>
        {sec.k === "metrics" ? <AgentMetrics lang={lang} code={agent.code} accent={agent.accent} />
          : sec.k === "achieves" || sec.k === "identifies" ? <AgentOutcome lang={lang} code={agent.code} accent={agent.accent} mode={sec.k} />
          : <p className="text-sm text-foreground">{t(lang, secBody(agent.code, sec.k))}</p>}
      </div>
    </div>
  );
}
