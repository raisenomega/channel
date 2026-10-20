/**
 * HUB by Raisen — AmplifiedChat: conversación ampliada del hilo (panel derecho).
 * Header (barra del contacto) con filtro por día ("busca mensaje de día específico") + lista de
 * mensajes con scroll infinito (MsgList). Define el helper de nombre de contacto por defecto.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaChat, WaMsg, WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { MsgList } from "./channel-msg-list";
import { fetchMessagesForDay } from "./channel-msg-fetch";
import { toWaMsg } from "./channel-phone-app";

export function contactNameFor(contactId: string | null): string {
  if (!contactId) return "Cliente";
  return `Cliente ${contactId.slice(0, 6)}`;
}

export function AmplifiedChat({ lang, chat, contact, msgs, meta, onOpenContact, onLoadOlder, hasMore, loadingOlder }: {
  lang: Idioma; chat: WaChat | null; contact: WaContact | undefined; msgs: readonly WaMsg[];
  meta: ChannelMeta; onOpenContact: () => void; onLoadOlder: () => void; hasMore: boolean; loadingOlder: boolean;
}) {
  const [day, setDay] = useState(""); // 2o: filtro por día (YYYY-MM-DD)
  const dayQ = useQuery({
    queryKey: ["channel-day", chat?.id, day],
    queryFn: () => (chat && day ? fetchMessagesForDay(chat.id, day) : Promise.resolve([])),
    enabled: !!(chat && day), staleTime: 10_000,
  });
  if (!chat) {
    return (
      <div className="cf-conv-placeholder">
        <span className="cf-conv-title">{t(lang, "cf.convSelect")}</span>
        <span className="cf-conv-sub">{t(lang, "cf.convSub")}</span>
      </div>
    );
  }
  const shown: readonly WaMsg[] = day ? (dayQ.data ?? []).map(toWaMsg) : msgs;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: meta.hex, color: "#fff", flexShrink: 0, borderRadius: 10 }}>
        <span onClick={onOpenContact} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
          {(chat.name ?? "?").charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0, flex: 1 }} onClick={onOpenContact}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{contact?.lastSeen ?? t(lang, "canal.enLinea")}</div>
        </div>
        <input type="date" value={day} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDay(e.target.value)}
          title="busca mensaje de día específico" aria-label="busca mensaje de día específico"
          style={{ flexShrink: 0, fontSize: 12, padding: "4px 6px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.92)", color: "#111", cursor: "pointer" }} />
        {day ? <span onClick={() => setDay("")} title="ver todo" style={{ cursor: "pointer", fontSize: 16, flexShrink: 0, lineHeight: 1 }}>×</span> : null}
      </div>
      <MsgList msgs={shown} meta={meta} lang={lang} onLoadOlder={day ? () => {} : onLoadOlder} hasMore={day ? false : hasMore} loadingOlder={day ? false : loadingOlder} />
    </div>
  );
}
