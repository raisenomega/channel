/**
 * HUB by Raisen — Mockup Samsung S25 Ultra con app WhatsApp real.
 * El celular simula la app movil (chats/estados/llamadas, hilos).
 * Panel derecho: conversacion ampliada + sidebar de contacto.
 * Estilos 100% aislados "wa-" (no alteran CSS global).
 */
import { useState, useMemo } from "react";

export interface WaChat {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  color: string;
  me?: boolean;
}

export interface WaMsg {
  id: string;
  out: boolean;
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface WaContact {
  name: string;
  phone: string;
  avatarColor: string;
  lastSeen: string;
}

const AVATARS = ["#075e54", "#128c7e", "#1f8a52", "#0a7ea4", "#7c3aed", "#c92a2a", "#0b7285", "#7048e8"];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length] ?? "#075e54";
}

function initials(name: string): string {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === y.toDateString()) return "Ayer";
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
}

/* ---------- Iconos SVG aislados ---------- */
const IC = {
  search: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.5 1.2 4.7 3.1 6.2L4 21l3.4-1.5c1.4.5 3 .8 4.6.8 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>',
  status: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4 10.7h-5v-6.5h1.8v4.8H16z"/></svg>',
  call: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3.1.7-.2 1z"/></svg>',
  emoji: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 8a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm7 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM12 18.5c-2.8 0-5.1-1.7-6.3-4h12.6c-1.2 2.3-3.5 4-6.3 4z"/></svg>',
  clip: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M17.5 6.5v9a5.5 5.5 0 0 1-11 0V6a3 3 0 0 1 6 0v9a1.5 1.5 0 0 1-3 0V6.5h2V15a.5.5 0 0 0 1 0V5.5a2.5 2.5 0 0 0-5 0v9.8a4 4 0 0 0 8 0v-8.8z"/></svg>',
  cam: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M17 10.5V7c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-3.5l4 4v-11z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 12z"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l4 4v-11z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3.1.7-.2 1z"/></svg>',
  media: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5z"/></svg>',
  doc: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 2v5h5z"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 14a1 1 0 0 1-.7-1.7l5-5a1 1 0 0 1 1.4 1.4l-5 5a1 1 0 0 1-.7.3zm4-8.7 2.3-2.3a3.5 3.5 0 0 1 5 5L19 10.3 16 7.3l2.3-2.3a1 1 0 0 0-1.4-1.4L14.6 6l-3-3 1.4-1.4.7.7z"/></svg>',
  config: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4h-1a8 8 0 0 0-1-2.5l.7-.7a1 1 0 0 0 0-1.4l-1.7-1.7a1 1 0 0 0-1.4 0l-.7.7a8 8 0 0 0-2.5-1V4a1 1 0 0 0-1-1h-2.4a1 1 0 0 0-1 1v.9a8 8 0 0 0-2.5 1l-.7-.7a1 1 0 0 0-1.4 0L3.4 7a1 1 0 0 0 0 1.4L4 9.2a8 8 0 0 0-1 2.5H2a1 1 0 0 0-1 1v2.4a1 1 0 0 0 1 1h1a8 8 0 0 0 1 2.5l-.7.7a1 1 0 0 0 0 1.4l1.7 1.7a1 1 0 0 0 1.4 0l.7-.7a8 8 0 0 0 2.5 1v.9a1 1 0 0 0 1 1h2.4a1 1 0 0 0 1-1v-.9a8 8 0 0 0 2.5-1l.7.7a1 1 0 0 0 1.4 0l1.7-1.7a1 1 0 0 0 0-1.4l-.7-.7a8 8 0 0 0 1-2.5h1a1 1 0 0 0 1-1v-2.4a1 1 0 0 0-1-1z"/></svg>',
};

export function samsungWhatsApp({ chats, messagesByChat, contact, onOpenContact }: {
  chats: readonly WaChat[];
  messagesByChat: (id: string) => readonly WaMsg[];
  contact: (id: string) => WaContact | undefined;
  onOpenContact: (id: string) => void;
}) {
  return <PhoneInner chats={chats} messagesByChat={messagesByChat} contact={contact} onOpenContact={onOpenContact} />;
}

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
    const c = chats.find((ch) => ch.id === activeChat);
    return c ?? null;
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
          <>
            <div className="wa-header">
              <span className="wa-avatar">HB</span>
              <span className="wa-title">WhatsApp</span>
              <span className="wa-ico" dangerouslySetInnerHTML={{ __html: IC.search }} />
              <span className="wa-ico" dangerouslySetInnerHTML={{ __html: IC.more }} />
            </div>
            <div className="wa-tabs">
              <span className={"wa-tab" + (tab === "chats" ? " on" : "")} onClick={() => setTab("chats")}>Chats</span>
              <span className={"wa-tab" + (tab === "status" ? " on" : "")} onClick={() => setTab("status")}>Estados</span>
              <span className={"wa-tab" + (tab === "calls" ? " on" : "")} onClick={() => setTab("calls")}>Llamadas</span>
            </div>
            {tab === "chats" ? (
              <div className="wa-chats">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Sin conversaciones</div>
                ) : (
                  chats.map((c) => (
                    <div key={c.id} className="wa-chat" onClick={() => setActiveChat(c.id)}>
                      <span className="wa-avatar" style={{ background: c.color }}>{initials(c.name)}</span>
                      <div className="wa-body">
                        <div className="wa-row1"><span className="wa-name">{c.name}</span><span className="wa-time">{c.time}</span></div>
                        <span className={"wa-preview" + (c.me ? " me" : "")}>{c.preview}</span>
                      </div>
                      {c.unread > 0 ? <span className="wa-unread">{c.unread}</span> : null}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <TabPlaceholder label={tab === "status" ? "Estados" : "Llamadas"} />
            )}
            <span className="wa-fab" dangerouslySetInnerHTML={{ __html: IC.chat }} />
          </>
        )}
      </div>
    </div>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="wa-chats p-4 text-center text-xs text-gray-500">
      <div className="mb-1 font-semibold text-gray-600">{label}</div>
      <div>Disponible en la app real de HUB</div>
    </div>
  );
}

function ChatScreen({ chat, msgs, contact, onBack, onOpenContact }: {
  chat: WaChat; msgs: readonly WaMsg[]; contact: WaContact | undefined;
  onBack: () => void; onOpenContact: () => void;
}) {
  return (
    <div className="wa-chatview">
      <div className="wa-chatview-head">
        <span className="wa-ico" onClick={onBack} dangerouslySetInnerHTML={{ __html: IC.back }} />
        <span className="wa-avatar" style={{ background: chat.color, cursor: "pointer" }} onClick={onOpenContact}>{initials(chat.name)}</span>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpenContact}>
          <div className="wa-name">{chat.name}</div>
          <div className="wa-sub">{contact?.lastSeen ?? "en línea"}</div>
        </div>
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: IC.video }} />
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: IC.phone }} />
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: IC.more }} />
      </div>
      <div className="wa-chatview-body">
        {msgs.length === 0 ? (
          <div className="p-3 text-center text-xs text-gray-500">Conversación sin mensajes aún</div>
        ) : (
          msgs.map((m, i) => {
            const prev = msgs[i - 1];
            const showDay = !prev || dayLabel(prev.time) !== dayLabel(m.time);
            return (
              <div key={m.id}>
                {showDay ? <div className="wa-day">{dayLabel(m.time)}</div> : null}
                <div className={"wa-bubble " + (m.out ? "out" : "in")}>
                  {m.text}
                  <span className="wa-meta">
                    {timeLabel(m.time)}
                    {m.out ? <Check status={m.status} /> : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="wa-inputbar">
        <span className="wa-emoji" dangerouslySetInnerHTML={{ __html: IC.emoji }} />
        <span className="wa-clip" dangerouslySetInnerHTML={{ __html: IC.clip }} />
        <input className="wa-input" placeholder="Mensaje" readOnly />
        <span className="wa-cam" dangerouslySetInnerHTML={{ __html: IC.cam }} />
        <span className="wa-mic" dangerouslySetInnerHTML={{ __html: IC.mic }} />
        <span className="wa-send" dangerouslySetInnerHTML={{ __html: IC.send }} />
      </div>
    </div>
  );
}

function Check({ status }: { status: WaMsg["status"] }) {
  const read = status === "read";
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }} title={String(status)}>
      <svg viewBox="0 0 16 10" width="13" height="8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 5l3.5 3.5L11 1.5" />
        {!read ? null : <path d="M6 7l3 3L15 4" />}
      </svg>
    </span>
  );
}

export function WaSidePanel({ active, chat, contact, msgs, onOpenContact }: {
  active: boolean; chat: WaChat | null; contact: WaContact | undefined;
  msgs: readonly WaMsg[]; onOpenContact: () => void;
}) {
  return (
    <div className="wa-side">
      <div className="wa-side-conv">
        {!active || !chat ? (
          <div className="wa-logo">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.5 1.2 4.7 3.1 6.2L4 21l3.4-1.5c1.4.5 3 .8 4.6.8 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>
            <div style={{ fontSize: 14 }}>Selecciona una conversación</div>
          </div>
        ) : (
          <>
            <div className="wa-side-head">
              <span className="wa-avatar" style={{ background: chat.color, width: 40, height: 40, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials(chat.name)}</span>
              <div style={{ flex: 1 }}>
                <div className="wa-name">{chat.name}</div>
                <div className="wa-sub">{contact?.lastSeen ?? "en línea"}</div>
              </div>
              <div onClick={onOpenContact} style={{ cursor: "pointer", display: "flex", gap: 6, color: "#25d366" }}>
                <span dangerouslySetInnerHTML={{ __html: IC.config }} />
                <span style={{ fontSize: 12 }}>Info</span>
              </div>
            </div>
            <div className="wa-side-body">
              {msgs.map((m, i) => {
                const prev = msgs[i - 1];
                const showDay = !prev || dayLabel(prev.time) !== dayLabel(m.time);
                return (
                  <div key={m.id}>
                    {showDay ? <div className="wa-day" style={{ margin: "6px auto" }}>{dayLabel(m.time)}</div> : null}
                    <div style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start", marginBottom: 5 }}>
                      <div className={"wa-bubble " + (m.out ? "out" : "in")} style={m.out ? { background: "#1e3a5f", color: "#fff" } : undefined}>
                        {m.text}
                        <span className="wa-meta">
                          {timeLabel(m.time)}
                          {m.out ? <Check status={m.status} /> : null}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function WaContactBar({ open, contact, onClose }: {
  open: boolean; contact: WaContact | null; onClose: () => void;
}) {
  return (
    <div className={"wa-contact-bar" + (open ? " open" : "")}>
      <div className="wa-contact-head">
        <span className="wa-ico" style={{ cursor: "pointer" }} onClick={onClose} dangerouslySetInnerHTML={{ __html: IC.back }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>Información del contacto</span>
      </div>
      <div className="wa-contact-body">
        {contact ? (
          <>
            <div className="wa-contact-hero">
              <span className="wa-avatar" style={{ background: colorFor(contact.name) }}>{initials(contact.name)}</span>
              <div className="wa-name">{contact.name}</div>
              <div className="wa-sub">{contact.lastSeen}</div>
            </div>
            <div className="wa-contact-sec">
              <h4>Teléfono</h4>
              <p>
                <span dangerouslySetInnerHTML={{ __html: IC.phone }} />
                <b>{contact.phone}</b>
              </p>
            </div>
            <div className="wa-contact-sec">
              <h4>Usuario</h4>
              <p>{contact.name.toLowerCase().replace(/\s+/g, "_")}</p>
            </div>
            <div className="wa-contact-sec">
              <h4>Medios, enlaces y docs</h4>
              <p><span dangerouslySetInnerHTML={{ __html: IC.media }} /> 2 fotos</p>
              <p><span dangerouslySetInnerHTML={{ __html: IC.doc }} /> 1 PDF</p>
              <p><span dangerouslySetInnerHTML={{ __html: IC.link }} /> raisen.agency</p>
            </div>
            <div className="wa-contact-sec">
              <h4>Configuración</h4>
              <p style={{ color: "#e55" }}>Bloquear</p>
              <p style={{ color: "#e55" }}>Silenciar notificaciones</p>
              <p>Exportar chat</p>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Selecciona un contacto</div>
        )}
      </div>
    </div>
  );
}

export function waChatFrom(conv: {
  conversationId: string; contactName: string; lastMessage: string; lastMessageAt: string; unreadCount: number; channel: string;
}): WaChat {
  return {
    id: conv.conversationId,
    name: conv.contactName === "Contacto" || !conv.contactName ? "Cliente WhatsApp" : conv.contactName,
    preview: conv.lastMessage || "Hola, ¿tienen disponibilidad?",
    time: timeLabel(conv.lastMessageAt),
    unread: conv.unreadCount,
    color: colorFor(conv.contactName),
  };
}