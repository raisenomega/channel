/**
 * HUB by Raisen — Navegador de agentes (estilo Agenda): chips de los 7 (con status real) + flechas
 * ‹ ›; clic o flecha selecciona el agente y muestra su pantalla completa. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { AGENTS } from "./agent-roster";
import { AgentPage } from "./agent-page";

export function AgentNavigator({ lang }: { lang: Idioma }) {
  const { agents: status } = useAgentStatus();
  const [idx, setIdx] = useState(0);
  const active = AGENTS[idx];
  const isOn = (code: string) => status.find((s) => s.name === code)?.online ?? false;
  const go = (d: number) => setIdx((i) => (i + d + AGENTS.length) % AGENTS.length);
  if (!active) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go(-1)} className="chip shrink-0 px-2 font-bold" aria-label="prev">{"‹"}</button>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {AGENTS.map((a, i) => (
            <button key={a.code} type="button" onClick={() => setIdx(i)} className={"chip inline-flex items-center gap-1 text-xs" + (active.code === a.code ? " active" : "")} style={active.code === a.code ? { color: `hsl(${a.accent})`, borderColor: `hsl(${a.accent})` } : undefined}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: isOn(a.code) ? "hsl(var(--success))" : "hsl(var(--text-dim))" }} />
              {t(lang, "agent.name." + a.code)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="chip shrink-0 px-2 font-bold" aria-label="next">{"›"}</button>
      </div>
      <AgentPage lang={lang} agent={active} online={isOn(active.code)} />
    </div>
  );
}
