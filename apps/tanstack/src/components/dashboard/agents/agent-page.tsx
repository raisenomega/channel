/**
 * HUB by Raisen — Pantalla completa de un agente (Fase 0): cabecera (avatar + nombre + posicion +
 * objetivo) + secciones Que hace / logra / identifica / metricas / que necesita para mejorar. Contenido
 * comercial (i18n); metricas vivas = vacio honesto hasta el backend. VICTOR ademas lleva chat. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { AgentDef } from "./agent-roster";
import { AgentAvatar } from "./agent-avatar";
import { VictorChat } from "./victor-chat";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card-soft p-3">
      <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{title}</p>
      <p className="text-sm text-foreground">{body}</p>
    </div>
  );
}

export function AgentPage({ lang, agent, online }: { lang: Idioma; agent: AgentDef; online: boolean }) {
  const k = (s: string) => t(lang, `ag.${agent.code}.${s}`);
  const name = t(lang, "agent.name." + agent.code);
  return (
    <div className="space-y-3">
      <header className="flex items-center gap-3">
        <AgentAvatar name={name} accent={agent.accent} src={`/agents/${agent.code}.png`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: online ? "hsl(var(--success))" : "hsl(var(--text-dim))" }} />
            <span className="text-[11px] text-muted-foreground">{t(lang, online ? "agent.status.online" : "agent.status.standby")}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: `hsl(${agent.accent})` }}>{k("pos")}</p>
          <p className="text-sm text-muted-foreground">{k("obj")}</p>
        </div>
      </header>
      <Section title={t(lang, "ag.secDoes")} body={k("does")} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Section title={t(lang, "ag.secAchieves")} body={t(lang, "ag.noData")} />
        <Section title={t(lang, "ag.secIdentifies")} body={t(lang, "ag.noData")} />
        <Section title={t(lang, "ag.secMetrics")} body={t(lang, "ag.noData")} />
        <Section title={t(lang, "ag.secImprove")} body={k("improve")} />
      </div>
      {agent.code === "victor" ? <VictorChat lang={lang} accent={agent.accent} /> : null}
    </div>
  );
}
