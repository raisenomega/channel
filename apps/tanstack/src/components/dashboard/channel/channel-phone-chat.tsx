/**
 * HUB by Raisen — ChatScreen: pantalla de chat interno del celular.
 * Muestra cabecera de marca + mensajes. Define toWaMsg (Mensaje → WaMsg).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaChat, WaMsg, WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { initials } from "./channel-meta";

export function toWaMsg(m: { senderType: string; content: string; createdAt: string; id: string }): WaMsg {
  return {
    id: m.id,
    out: m.senderType !== "contact", // inbound=contact=izquierda; human_agent/ai_agent/system=outbound=derecha
    text: m.content,
    time: m.createdAt,
    status: m.senderType === "contact" ? "read" : "delivered",
  };
}

export function ChatScreen({ meta, chat, msgs, onBack, onOpenContact, contact, lang }: {
  meta: ChannelMeta;
  chat: WaChat;
  msgs: readonly WaMsg[];
  onBack: () => void;
  onOpenContact: () => void;
  contact: WaContact | undefined;
  lang: Idioma;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: meta.bg, color: meta.fg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: meta.hex, color: "#fff", flexShrink: 0 }}>
        <span onClick={onBack} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", fontSize: 16, fontWeight: 700, color: "#fff" }} aria-label={t(lang, "common.back")}>
          ‹
        </span>
        <span onClick={onOpenContact} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
          {initials(chat.name)}
        </span>
        <div style={{ cursor: "pointer", minWidth: 0 }} onClick={onOpenContact}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{chat.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{contact?.lastSeen ?? t(lang, "canal.enLinea")}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
          <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="video">📹</span>
          <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="phone">📞</span>
          <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="more">⋮</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {msgs.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12, color: meta.muted, padding: 12 }}>{t(lang, "canal.sinMsgs")}</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%", padding: "6px 9px", borderRadius: 9, fontSize: 13, wordBreak: "break-word", background: m.out ? meta.bubbleOut : meta.bubbleIn, color: meta.fg, boxShadow: "0 1px 1px rgba(0,0,0,0.08)", lineHeight: 1.35 }}>
                {m.text}
                <div style={{ float: "right", margin: "4px 0 -2px 8px", fontSize: 10, color: meta.muted, opacity: 0.8 }}>
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