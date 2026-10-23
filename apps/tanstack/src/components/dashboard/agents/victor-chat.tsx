/**
 * HUB by Raisen — Chat de VICTOR (shell de UI). El cliente planifica; Victor orquesta a sus agentes.
 * Modo foco: `full` = ocupa toda la altura; `onClose` muestra la [x] para colapsar. El orquestado en
 * vivo se activa con su cerebro (Fase 2) — no se simula respuesta. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";

export function VictorChat({ lang, accent, onClose, full }: { lang: Idioma; accent: string; onClose?: () => void; full?: boolean }) {
  const [msgs, setMsgs] = useState<string[]>([]);
  const [text, setText] = useState("");
  const send = () => { const v = text.trim(); if (v) { setMsgs((m) => [...m, v]); setText(""); } };
  return (
    <div className={"overflow-hidden rounded-xl border border-border/50 bg-card-soft" + (full ? " flex h-full flex-col" : "")}>
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <span className="text-xs font-bold" style={{ color: `hsl(${accent})` }}>{t(lang, "ag.victor.chatTitle")}</span>
        {onClose ? <button type="button" onClick={onClose} className="text-base text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button> : null}
      </div>
      <div className={"space-y-2 overflow-y-auto p-3" + (full ? " flex-1" : " max-h-64 min-h-[120px]")}>
        {msgs.length === 0 ? <p className="text-xs text-muted-foreground">{t(lang, "ag.victor.chatEmpty")}</p> : msgs.map((m, i) => (
          <div key={i} className="ml-auto max-w-[80%] rounded-lg px-3 py-1.5 text-sm text-foreground" style={{ background: `hsl(${accent} / 0.14)` }}>{m}</div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border/40 p-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={t(lang, "ag.victor.chatPh")} className="flex-1 rounded border border-border/55 bg-card-soft p-2 text-sm text-foreground" />
        <button type="button" onClick={send} className="chip font-bold text-white" style={{ background: `hsl(${accent})` }}>{t(lang, "agenda.enviar")}</button>
      </div>
    </div>
  );
}
