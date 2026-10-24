/**
 * HUB by Raisen — Navegador de agentes (estilo Agenda): chips de los 7 (status real) + chip Contexto
 * (verde > 70% del contexto lleno) + flechas ‹ ›; clic o flecha muestra la pantalla completa. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useContextStatus } from "@/hooks/useContextStatus";
import { AGENTS } from "./agent-roster";
import { AgentPage } from "./agent-page";
import { VictorPage } from "./victor-page";
import { ContextoPage } from "./contexto-page";

const CTX_ACCENT = "45 90% 55%";

export function AgentNavigator({ lang, accent }: { lang: Idioma; accent: string }) {
  const { agents: status } = useAgentStatus();
  const ctx = useContextStatus();
  const [idx, setIdx] = useState(0);
  const [ctxSel, setCtxSel] = useState(false);
  const active = AGENTS[idx];
  const isOn = (code: string) => status.find((s) => s.name === code)?.online ?? false;
  const go = (d: number) => { setCtxSel(false); setIdx((i) => (i + d + AGENTS.length) % AGENTS.length); };
  if (!active) return null;
  const dot = (on: boolean) => ({ background: on ? "hsl(var(--success))" : "hsl(var(--text-dim))" });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go(-1)} className="chip shrink-0 px-2 font-bold" aria-label="prev">{"‹"}</button>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {AGENTS.map((a, i) => (
            <button key={a.code} type="button" onClick={() => { setCtxSel(false); setIdx(i); }} className={"chip inline-flex items-center gap-1 text-xs" + (!ctxSel && active.code === a.code ? " active" : "")} style={!ctxSel && active.code === a.code ? { color: `hsl(${a.accent})`, borderColor: `hsl(${a.accent})` } : undefined}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={dot(isOn(a.code))} />
              {t(lang, "agent.name." + a.code)}
            </button>
          ))}
          <button type="button" onClick={() => setCtxSel(true)} className={"chip inline-flex items-center gap-1 text-xs" + (ctxSel ? " active" : "")} style={ctxSel ? { color: `hsl(${CTX_ACCENT})`, borderColor: `hsl(${CTX_ACCENT})` } : undefined}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={dot(ctx.green)} />
            {t(lang, "ctx.chip")}
          </button>
        </div>
        <button type="button" onClick={() => go(1)} className="chip shrink-0 px-2 font-bold" aria-label="next">{"›"}</button>
      </div>
      {ctxSel
        ? <ContextoPage lang={lang} accent={CTX_ACCENT} />
        : active.code === "victor"
        ? <VictorPage lang={lang} agent={active} online={isOn(active.code)} channelAccent={accent} />
        : <AgentPage lang={lang} agent={active} online={isOn(active.code)} />}
    </div>
  );
}
