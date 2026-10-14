/**
 * HUB by Raisen — Cuerpo del mockup de WhatsApp (lista + pestañas).
 * Orquesta la vista de inicio y el chat interno.
 */
import { useState, useMemo } from "react";
import { type WaChat, type WaMsg, type WaContact } from "./wa-types";
import { ChatScreen } from "./wa-chat-screen";
import { WaHome } from "./wa-home";

function PhoneInner({ chats, messagesByChat, contact, onOpenContact }: {
  chats: readonly WaChat[];
  messagesByChat: (id: string) => readonly WaMsg[];
  contact: (id: string) => WaContact | undefined;
  onOpenContact: (id: string) => void;
}) {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [tab, setTab] = useState<"chats" | "status" | "calls">("chats");

  const current = useMemo(() => {
    if (!activeChat) return null;
    return chats.find((ch) => ch.id === activeChat) ?? null;
  }, [activeChat, chats]);

  const msgs = activeChat ? messagesByChat(activeChat) : [];

  return (
    <div className="wa-phone">
      <div className="wa-screen wa-app">
        <span className="wa-punch" />
        {current ? (
          <ChatScreen
            chat={current}
            msgs={msgs}
            contact={contact(current.id)}
            onBack={() => setActiveChat(null)}
            onOpenContact={() => onOpenContact(current.id)}
          />
        ) : (
          <WaHome chats={chats} tab={tab} onTab={setTab} onSelect={(id) => setActiveChat(id)} />
        )}
      </div>
    </div>
  );
}

export function samsungWhatsApp({ chats, messagesByChat, contact, onOpenContact }: {
  chats: readonly WaChat[];
  messagesByChat: (id: string) => readonly WaMsg[];
  contact: (id: string) => WaContact | undefined;
  onOpenContact: (id: string) => void;
}) {
  return <PhoneInner chats={chats} messagesByChat={messagesByChat} contact={contact} onOpenContact={onOpenContact} />;
}