/**
 * HUB by Raisen — AmplifiedChat: conversación ampliada del hilo
 * seleccionado en el panel derecho del ChannelFrame. También define
 * helper de nombre de contacto por defecto para los chats del canal.
 */
import { useRef, useEffect } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaChat, WaMsg, WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";

export function contactNameFor(contactId: string | null): string {
  if (!contactId) return "Cliente";
  return `Cliente ${contactId.slice(0, 6)}`;
}

export function AmplifiedChat({ lang, chat, contact, msgs, meta, onOpenContact }: {
  lang: Idioma;
  chat: WaChat | null;
  contact: WaContact | undefined;
  msgs: readonly WaMsg[];
  meta: ChannelMeta;
  onOpenContact: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Autoscroll al último mensaje cuando entra/envías uno (Issue #B). El scrollback manual queda intacto.
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);
  if (!chat) {
    return (
      <div className="cf-conv-placeholder">
        <span className="cf-conv-title">{t(lang, "cf.convSelect")}</span>
        <span className="cf-conv-sub">{t(lang, "cf.convSub")}</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: meta.hex, color: "#fff", flexShrink: 0, borderRadius: 10 }}>
        <span
          onClick={onOpenContact}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}
        >
          {(chat.name ?? "?").charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }} onClick={onOpenContact} >
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{chat.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{contact?.lastSeen ?? t(lang, "canal.enLinea")}</div>
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {msgs.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 13, color: meta.muted, padding: 18 }}>{t(lang, "canal.sinMsgs")}</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "72%", padding: "7px 11px", borderRadius: 10, fontSize: 14, wordBreak: "break-word", background: m.out ? meta.bubbleOut : meta.bubbleIn, color: meta.fg, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", lineHeight: 1.4 }}>
                {m.text}
                <div style={{ float: "right", margin: "4px 0 -2px 8px", fontSize: 10, color: meta.muted, opacity: 0.85, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {new Date(m.time).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}