/**
 * HUB by Raisen — Chat de VICTOR (Fase 0: shell de UI). El cliente planifica; Victor orquesta a sus
 * agentes. El orquestado en vivo se activa con su cerebro (Fase 2) — no se simula una respuesta. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";

export function VictorChat({ lang, accent }: { lang: Idioma; accent: string }) {
  const [msgs, setMsgs] = useState<string[]>([]);
  const [text, setText] = useState("");
  const send = () => { const v = text.trim(); if (v) { setMsgs((m) => [...m, v]); setText(""); } };
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card-soft">
      <div className="border-b border-border/40 px-3 py-2 text-xs font-bold" style={{ color: `hsl(${accent})` }}>{t(lang, "ag.victor.chatTitle")}</div>
      <div className="max-h-64 min-h-[120px] space-y-2 overflow-y-auto p-3">
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
