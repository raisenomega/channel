/**
 * HUB by Raisen — Lista de chats del mockup de WhatsApp.
 * Renderiza la nube de conversaciones con avatar, nombre y preview.
 */
import { initials, type WaChat } from "./wa-types";

export function WaChatList({ chats, onSelect }: {
  chats: readonly WaChat[];
  onSelect: (id: string) => void;
}) {
  if (chats.length === 0) {
    return <div className="wa-chats"><div className="p-4 text-center text-xs text-gray-500">Sin conversaciones</div></div>;
  }
  return (
    <div className="wa-chats">
      {chats.map((c) => (
        <div key={c.id} className="wa-chat" onClick={() => onSelect(c.id)}>
          <span className="wa-avatar" style={{ background: c.color }}>{initials(c.name)}</span>
          <div className="wa-body">
            <div className="wa-row1"><span className="wa-name">{c.name}</span><span className="wa-time">{c.time}</span></div>
            <span className={"wa-preview" + (c.me ? " me" : "")}>{c.preview}</span>
          </div>
          {c.unread > 0 ? <span className="wa-unread">{c.unread}</span> : null}
        </div>
      ))}
    </div>
  );
}