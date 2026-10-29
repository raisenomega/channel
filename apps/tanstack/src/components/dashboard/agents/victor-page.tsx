/**
 * HUB by Raisen — Pagina de VICTOR (centro de mando): en la linea del cargo, chips de accion (Que hace/
 * logra/identifica/metricas/que necesita mejorar); clic muestra ese panel. La cabecera (foto+perfil)
 * SIEMPRE visible; la barra "Hablar con Victor" (borde con el acento del canal) despliega el chat DEBAJO
 * a pantalla completa sin tapar la foto; [x] colapsa y vuelve. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { type AgentDef, SECS, secBody } from "./agent-roster";
import { AgentAvatar } from "./agent-avatar";
import { VictorChat } from "./victor-chat";
import { VictorCommand } from "./victor-command";
import { AgentOutcome } from "./agent-outcome";

export function VictorPage({ lang, agent, online, channelAccent }: { lang: Idioma; agent: AgentDef; online: boolean; channelAccent: string }) {
  const [tab, setTab] = useState(0);
  const [chat, setChat] = useState(true); // aterriza con el chat desplegado, listo para escribir
  const name = t(lang, "agent.name.victor");
  const sec = SECS[tab] ?? SECS[0]!;
  return (
    <div className="space-y-3">
      <header className="flex items-start gap-3">
        <AgentAvatar name={name} accent={agent.accent} src="/agents/victor.png" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: online ? "hsl(var(--success))" : "hsl(var(--text-dim))" }} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold" style={{ color: `hsl(${agent.accent})` }}>{t(lang, "ag.victor.pos")}</span>
            {SECS.map((s, i) => (
              <button key={s.k} type="button" onClick={() => { setTab(i); setChat(false); }} className={"chip text-[11px]" + (!chat && tab === i ? " active" : "")} style={!chat && tab === i ? { color: `hsl(${agent.accent})`, borderColor: `hsl(${agent.accent})` } : undefined}>{t(lang, s.label)}</button>
            ))}
          </div>
        </div>
      </header>
      {chat ? (
        <div className="h-[58vh]"><VictorChat lang={lang} accent={agent.accent} onClose={() => setChat(false)} full /></div>
      ) : (
        <>
          <div className="min-h-[160px] rounded-xl border border-border/40 bg-card-soft p-4">
            <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, sec.label)}</p>
            {sec.k === "metrics" ? <VictorCommand lang={lang} accent={channelAccent} />
              : sec.k === "achieves" || sec.k === "identifies" ? <AgentOutcome lang={lang} code="victor" accent={agent.accent} mode={sec.k} />
              : <p className="text-sm text-foreground">{t(lang, secBody("victor", sec.k))}</p>}
          </div>
          <button type="button" onClick={() => setChat(true)} className="flex w-full items-center gap-2 rounded-xl border-2 bg-card-soft px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted/20" style={{ borderColor: `hsl(${channelAccent} / 0.55)` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            {t(lang, "ag.victor.chatOpen")}
          </button>
        </>
      )}
    </div>
  );
}
