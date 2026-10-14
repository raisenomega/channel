/**
 * HUB by Raisen — PhoneApp: contenido del celular de marca.
 * Muestra la lista de conversaciones o el chat interno seleccionado.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaChat, WaMsg, WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { initials, avatarColor } from "./channel-meta";
import { ChatScreen } from "./channel-phone-chat";

export { toWaMsg } from "./channel-phone-chat";

function ChatList({ meta, chats, onSelect, lang }: {
  meta: ChannelMeta;
  chats: readonly WaChat[];
  onSelect: (id: string) => void;
  lang: Idioma;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: meta.bg, color: meta.fg }}>
      {chats.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: meta.muted, padding: 18 }}>{t(lang, "canal.vacio")}</div>
      ) : (
        chats.map((c) => (
          <div key={c.id} onClick={() => onSelect(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${meta.muted}22`, cursor: "pointer", transition: "background 0.12s" }}>
            <span style={{ width: 42, height: 42, borderRadius: "50%", background: avatarColor(c.name), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {initials(c.name)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                <span style={{ fontSize: 11, color: meta.muted, flexShrink: 0, marginLeft: 6 }}>{c.time}</span>
              </div>
              <div style={{ fontSize: 12.5, color: meta.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview}</div>
            </div>
            {c.unread > 0 ? (
              <span style={{ background: meta.hex, color: "#fff", borderRadius: 999, fontSize: 11, width: 19, height: 19, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginLeft: 2, flexShrink: 0 }}>
                {c.unread}
              </span>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

export function PhoneApp({ meta, chats, activeId, msgs, onSelect, onOpenContact, contact, lang }: {
  meta: ChannelMeta;
  chats: readonly WaChat[];
  activeId: string | null;
  msgs: readonly WaMsg[];
  onSelect: (id: string) => void;
  onOpenContact: () => void;
  contact: WaContact | undefined;
  lang: Idioma;
}) {
  const activeChat = chats.find((c) => c.id === activeId) ?? null;
  if (activeChat) {
    return <ChatScreen meta={meta} chat={activeChat} msgs={msgs} onBack={() => onSelect("")} onOpenContact={onOpenContact} contact={contact} lang={lang} />;
  }
  return <ChatList meta={meta} chats={chats} onSelect={onSelect} lang={lang} />;
}