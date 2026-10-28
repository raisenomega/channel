/**
 * HUB by Raisen — Navegador de agentes: chips de los 7 (status real) + Contexto (verde >70%) +
 * Borradores (cola supervisada, con conteo) + flechas ‹ ›. Clic muestra la pantalla completa. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useContextStatus } from "@/hooks/useContextStatus";
import { AGENTS } from "./agent-roster";
import { AgentPage } from "./agent-page";
import { VictorPage } from "./victor-page";
import { ContextoPage } from "./contexto-page";
import { ModeControl } from "./mode-control";

const CTX_ACCENT = "45 90% 55%";
type View = "agent" | "contexto";

export function AgentNavigator({ lang, accent }: { lang: Idioma; accent: string }) {
  const { agents: status } = useAgentStatus();
  const ctx = useContextStatus();
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<View>("agent");
  const active = AGENTS[idx];
  const isOn = (code: string) => status.find((s) => s.name === code)?.online ?? false;
  if (!active) return null;
  const dot = (on: boolean) => ({ background: on ? "hsl(var(--success))" : "hsl(var(--text-dim))" });
  const chip = (v: View, acc: string, on: boolean, label: string) => (
    <button type="button" onClick={() => setView(v)} className={"chip inline-flex items-center gap-1 text-xs" + (view === v ? " active" : "")} style={view === v ? { color: `hsl(${acc})`, borderColor: `hsl(${acc})` } : undefined}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={dot(on)} />{label}
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {AGENTS.map((a, i) => (
          <button key={a.code} type="button" onClick={() => { setView("agent"); setIdx(i); }} className={"chip inline-flex items-center gap-1 text-xs" + (view === "agent" && active.code === a.code ? " active" : "")} style={view === "agent" && active.code === a.code ? { color: `hsl(${a.accent})`, borderColor: `hsl(${a.accent})` } : undefined}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={dot(isOn(a.code))} />{t(lang, "agent.name." + a.code)}
          </button>
        ))}
        {chip("contexto", CTX_ACCENT, ctx.green, t(lang, "ctx.chip"))}
        <ModeControl lang={lang} />
      </div>
      {view === "contexto" ? <ContextoPage lang={lang} accent={CTX_ACCENT} />
        : active.code === "victor" ? <VictorPage lang={lang} agent={active} online={isOn(active.code)} channelAccent={accent} />
        : <AgentPage lang={lang} agent={active} online={isOn(active.code)} />}
    </div>
  );
}
