/**
 * HUB by Raisen — AmplifiedChat: conversación ampliada del hilo seleccionado (panel derecho).
 * Header (barra del contacto) + lista de mensajes con scroll infinito (MsgList). También define el
 * helper de nombre de contacto por defecto para los chats del canal.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaChat, WaMsg, WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { MsgList } from "./channel-msg-list";

export function contactNameFor(contactId: string | null): string {
  if (!contactId) return "Cliente";
  return `Cliente ${contactId.slice(0, 6)}`;
}

export function AmplifiedChat({ lang, chat, contact, msgs, meta, onOpenContact, onLoadOlder, hasMore, loadingOlder }: {
  lang: Idioma;
  chat: WaChat | null;
  contact: WaContact | undefined;
  msgs: readonly WaMsg[];
  meta: ChannelMeta;
  onOpenContact: () => void;
  onLoadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
}) {
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
        <span onClick={onOpenContact} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
          {(chat.name ?? "?").charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }} onClick={onOpenContact}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{chat.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{contact?.lastSeen ?? t(lang, "canal.enLinea")}</div>
        </div>
      </div>
      <MsgList msgs={msgs} meta={meta} lang={lang} onLoadOlder={onLoadOlder} hasMore={hasMore} loadingOlder={loadingOlder} />
    </div>
  );
}
