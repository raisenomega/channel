/**
 * HUB by Raisen — Chat REAL de VICTOR: el dueno planifica y Victor responde (Anthropic) via
 * POST /tenants/:id/agents/victor/chat. Modo foco (`full` + `onClose`). Aun sin memoria de clientes
 * (eso llega con CEREBRO). C4 <=75.
 */
import { useState, useEffect, useRef } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

interface Msg { from: "me" | "victor"; text: string }

export function VictorChat({ lang, accent, onClose, full }: { lang: Idioma; accent: string; onClose?: () => void; full?: boolean }) {
  const chatKey = `hub.victor.chat:${resolveTenantId() ?? "anon"}`; // hilo persistente por negocio (como WhatsApp)
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { const r = window.localStorage.getItem(chatKey); return r ? (JSON.parse(r) as Msg[]) : []; } catch { return []; }
  });
  useEffect(() => { try { window.localStorage.setItem(chatKey, JSON.stringify(msgs)); } catch { /* storage bloqueado */ } }, [chatKey, msgs]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]); // auto-scroll: siempre lo reciente en vivo
  const send = async () => {
    const v = text.trim();
    if (!v || busy) return;
    setText(""); setMsgs((m) => [...m, { from: "me", text: v }]); setBusy(true);
    const tid = resolveTenantId();
    try {
      const hist = msgs.slice(-12).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text })); // hilo: Victor razona con TODO el contexto previo
      const res = tid ? await apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/victor/chat`, { method: "POST", body: JSON.stringify({ message: v, history: hist }) }) : null;
      if (!res || !res.ok) {
        const st = res ? res.status : 0;
        const aviso = st === 502 ? t(lang, "ag.victor.ctxLong") : `${t(lang, "ag.victor.chatErr")} (${st})`;
        setMsgs((m) => [...m, { from: "victor", text: aviso }]); setBusy(false); return;
      }
      const d = (await res.json()) as { reply?: string };
      const reply = (d.reply ?? "").trim();
      setMsgs((m) => [...m, { from: "victor", text: reply || t(lang, "ag.victor.chatErr") }]);
    } catch { setMsgs((m) => [...m, { from: "victor", text: t(lang, "ag.victor.chatErr") }]); }
    setBusy(false);
  };
  return (
    <div className={"overflow-hidden rounded-xl border border-border/50 bg-card-soft" + (full ? " flex h-full flex-col" : "")}>
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <span className="text-xs font-bold" style={{ color: `hsl(${accent})` }}>{t(lang, "ag.victor.chatTitle")}</span>
        {onClose ? <button type="button" onClick={onClose} className="text-base text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button> : null}
      </div>
      <div className={"space-y-2 overflow-y-auto p-3" + (full ? " min-h-0 flex-1" : " max-h-64 min-h-[120px]")}>
        {msgs.length === 0 ? <p className="text-xs text-muted-foreground">{t(lang, "ag.victor.chatEmpty")}</p> : msgs.map((m, i) => (
          <div key={i} className={"max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-1.5 text-sm text-foreground " + (m.from === "me" ? "ml-auto" : "mr-auto bg-muted/30")} style={m.from === "me" ? { background: `hsl(${accent} / 0.14)` } : undefined}>{m.text}</div>
        ))}
        {busy ? <p className="mr-auto text-xs text-muted-foreground">{t(lang, "ag.victor.thinking")}</p> : null}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-border/40 p-2">
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder={t(lang, "ag.victor.chatPh")} className="flex-1 rounded border border-border/55 bg-card-soft p-2 text-sm text-foreground" />
        <button type="button" onClick={() => void send()} disabled={busy} className="chip font-bold text-white" style={{ background: `hsl(${accent})` }}>{t(lang, "agenda.enviar")}</button>
      </div>
    </div>
  );
}
