/**
 * HUB by Raisen — Tira "los 7 agentes leen este contexto" (cierre del wizard de Contexto). C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { AGENTS } from "./agent-roster";
import { AgentAvatar } from "./agent-avatar";

export function ContextoAgentsStrip({ lang }: { lang: Idioma }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-card-soft p-3">
      <span className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "ctx.agentsUse")}</span>
      {AGENTS.map((a) => <AgentAvatar key={a.code} name={t(lang, "agent.name." + a.code)} accent={a.accent} src={`/agents/${a.code}.png`} />)}
    </div>
  );
}
