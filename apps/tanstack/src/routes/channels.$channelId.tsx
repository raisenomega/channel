/**
 * HUB by Raisen — Vista de canal individual.
 * CUALQUIER canal (no solo WhatsApp) usa:
 *   - ChannelFrame: panel flotante glass (header + acciones + input en el panel).
 *   - BrandPhone: celular de la marca con la lista de conversaciones del canal.
 *   - Click hilo -> se muestra el chat interno de esa conversación dentro del celular.
 *   - Sidebar de contacto al pulsar el avatar (WaContactBar).
 * Datos reales via Supabase REST (conversaciones/mensajes/contactos). Sin datos mock.
 * i18n completo.
 */
import { useState, useMemo } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { ChannelIcon, type ChannelKind } from "@/components/ui/channel-icon";
import { Button } from "@/components/ui/button";
import type { Mensaje } from "@/lib/types";
import {
  WaContactBar,
  waChatFrom,
  type WaChat, type WaMsg, type WaContact,
} from "@/components/dashboard/whatsapp-phone";
import { ChannelFrame, type ChannelFrameActions } from "@/components/dashboard/channel-frame";
import { BrandPhone, type BrandKind } from "@/components/dashboard/brand-phone";

export const CanalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/$channelId",
  component: CanalViewPage,
});

const MESSAGE_COLS = ["id", "conversation_id", "sender_type", "sender_id", "content", "message_type", "created_at"];
const CONV_COLS = ["id", "contact_id", "primary_channel", "subject", "last_message_at"];
const CONTACT_COLS = ["id", "display_name", "primary_phone", "primary_email"];

function enc(v: string): string { return encodeURIComponent(v); }

async function fetchChannelConversations(channelId: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/conversations?select=${enc(CONV_COLS.join(","))}` +
    `&primary_channel=eq.${enc(channelId)}&order=last_message_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      id: string; contact_id: string | null; primary_channel: string | null;
      subject: string | null; last_message_at: string | null;
    }>;
  } catch { return []; }
}

async function fetchMessagesForConversation(conversationId: string): Promise<Mensaje[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=${enc(MESSAGE_COLS.join(","))}` +
    `&conversation_id=eq.${enc(conversationId)}&order=created_at.asc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as Array<{
      id: string; conversation_id: string; sender_type: string;
      sender_id: string | null; content: string; message_type: string; created_at: string;
    }>;
    return filas.map((r) => ({
      id: String(r.id), conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_id ? String(r.sender_id) : null,
      content: String(r.content), messageType: String(r.message_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch { return []; }
}

async function fetchContact(id: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const url = `${base}/contacts?id=eq.${enc(id)}&select=${enc(CONTACT_COLS.join(","))}&limit=1`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ id: string; display_name: string | null; primary_phone: string | null; primary_email: string | null }>;
    return rows[0] ?? null;
  } catch { return null; }
}

function toWaMsg(m: Mensaje): WaMsg {
  return {
    id: m.id,
    out: m.senderType === "agent",
    text: m.content,
    time: m.createdAt,
    status: m.senderType === "contact" ? "read" : "delivered",
  };
}

/* ── Metadatos de marca por canal ─────────────────────────────── */
interface ChannelMeta {
  brand: BrandKind;
  /** Acento único (triplete HSL sin hsl()) para el panel ChannelFrame. */
  hsl: string;
  /** Acento hex usado en la cabecera del chat interno del celular. */
  hex: string;
  /** Color de fondo de pantalla del celular. */
  bg: string;
  /** Color de texto primario dentro de la pantalla del celular. */
  fg: string;
  /** Color de texto secundario/muted dentro del celular. */
  muted: string;
  /** Fondo de una burbuja entrante. */
  bubbleIn: string;
  /** Fondo de una burbuja saliente. */
  bubbleOut: string;
}

const CHANNEL_META: Record<ChannelKind, ChannelMeta> = {
  whatsapp: { brand: "whatsapp", hsl: "142 70% 28%", hex: "#075e54", bg: "#e5ddd5", fg: "#1f2926", muted: "#667781", bubbleIn: "#ffffff", bubbleOut: "#d9fdd3" },
  email:    { brand: "gmail",    hsl: "4 82% 56%",   hex: "#EA4335", bg: "#ffffff", fg: "#202124", muted: "#5f6368", bubbleIn: "#f1f3f4", bubbleOut: "#fce8e6" },
  instagram:{ brand: "instagram",hsl: "332 72% 50%", hex: "#d62976", bg: "#ffffff", fg: "#262626", muted: "#8e8e8e", bubbleIn: "#efefef", bubbleOut: "#ffd6e6" },
  facebook: { brand: "facebook", hsl: "221 88% 53%", hex: "#1877F2", bg: "#ffffff", fg: "#1c1e21", muted: "#65676b", bubbleIn: "#e4e6eb", bubbleOut: "#dcebff" },
  telegram: { brand: "telegram", hsl: "201 78% 52%", hex: "#26A5E4", bg: "#ffffff", fg: "#0f1419", muted: "#5b7083", bubbleIn: "#e8eef3", bubbleOut: "#d2ecfb" },
  sms:      { brand: "sms",      hsl: "122 39% 49%", hex: "#4CAF50", bg: "#ffffff", fg: "#111111", muted: "#5f6368", bubbleIn: "#eef1ee", bubbleOut: "#dcf5dd" },
  x:        { brand: "x",        hsl: "210 60% 55%", hex: "#1d9bf0", bg: "#000000", fg: "#e7e9ea", muted: "#71767b", bubbleIn: "#2f3336", bubbleOut: "#1d9bf0" },
  linkedin: { brand: "linkedin", hsl: "203 89% 40%", hex: "#0A66C2", bg: "#ffffff", fg: "#111111", muted: "#666666", bubbleIn: "#eef3f8", bubbleOut: "#e2edf9" },
  webchat:  { brand: "webchat",  hsl: "240 100% 69%",hex: "#6C63FF", bg: "#f4f5fb", fg: "#1b1b2f", muted: "#6a6a7d", bubbleIn: "#ffffff", bubbleOut: "#ddd9ff" },
};

/* Colores de avatar deterministas por nombre. */
const AVATAR_COLORS = ["#075e54", "#128c7e", "#1f8a52", "#0a7ea4", "#7c3aed", "#c92a2a", "#0b7285", "#7048e8"];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? "#075e54";
}
function initials(name: string): string {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

/* ── Contenido del celular: lista de conversaciones + chat interno ── */
function PhoneApp({
  meta, chats, activeId, msgs, onSelect, onOpenContact, contact, lang,
}: {
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
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: meta.bg, color: meta.fg }}>
        {/* Header del chat (reemplaza la cabecera de marca mientras hay hilo abierto) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: meta.hex, color: "#fff", flexShrink: 0 }}>
          <span
            onClick={() => onSelect("")}
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", fontSize: 16, fontWeight: 700, color: "#fff" }}
            aria-label={t(lang, "common.back")}
          >
            ‹
          </span>
          <span
            onClick={onOpenContact}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}
          >
            {initials(activeChat.name)}
          </span>
          <div style={{ cursor: "pointer", minWidth: 0 }} onClick={onOpenContact}>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{activeChat.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{contact?.lastSeen ?? t(lang, "canal.enLinea")}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="video">📹</span>
            <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="phone">📞</span>
            <span style={{ cursor: "pointer", fontSize: 13 }} aria-label="more">⋮</span>
          </div>
        </div>
        {/* Mensajes */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {msgs.length === 0 ? (
            <div style={{ textAlign: "center", fontSize: 12, color: meta.muted, padding: 12 }}>
              {t(lang, "canal.sinMsgs")}
            </div>
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

  // Lista de conversaciones
  return (
    <div style={{ display: "flex", flexDirection: "column", background: meta.bg, color: meta.fg }}>
      {chats.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: meta.muted, padding: 18 }}>
          {t(lang, "canal.vacio")}
        </div>
      ) : (
        chats.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${meta.muted}22`, cursor: "pointer", transition: "background 0.12s" }}
          >
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

function CanalViewPage() {
  const { channelId } = useParams({ from: CanalRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const kind = channelId as ChannelKind;
  const meta = CHANNEL_META[kind] ?? CHANNEL_META.webchat;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [contactBarOpen, setContactBarOpen] = useState(false);
  const [composer, setComposer] = useState("");

  const { data: conversations } = useQuery({
    queryKey: ["channel-convs", channelId],
    queryFn: () => fetchChannelConversations(channelId),
    staleTime: 20_000,
  });
  const { data: msgMap } = useQuery({
    queryKey: ["channel-msgs", channelId, activeId],
    queryFn: async () => {
      if (!activeId) return {} as Record<string, Mensaje[]>;
      const msgs = await fetchMessagesForConversation(activeId);
      return { [activeId]: msgs } as Record<string, Mensaje[]>;
    },
    enabled: !!activeId,
    staleTime: 10_000,
  });
  const { data: contactInfo } = useQuery({
    queryKey: ["channel-contact", activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const conv = (conversations ?? []).find((c) => c.id === activeId);
      if (!conv?.contact_id) return null;
      return fetchContact(conv.contact_id);
    },
    enabled: !!activeId && !!conversations,
    staleTime: 60_000,
  });

  const chats: WaChat[] = useMemo(() => {
    return (conversations ?? []).map((c) => waChatFrom({
      conversationId: c.id,
      contactName: contactNameFor(c.contact_id),
      lastMessage: c.subject ?? "",
      lastMessageAt: c.last_message_at ?? new Date().toISOString(),
      unreadCount: 0,
      channel: channelId,
    }));
  }, [conversations, channelId]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const activeMsgs: WaMsg[] = useMemo(
    () => (activeId && msgMap?.[activeId] ? msgMap[activeId].map(toWaMsg) : []),
    [msgMap, activeId],
  );

  const activeContactName = contactInfo?.display_name ?? activeChat?.name ?? "";
  const activeContact: WaContact = {
    name: activeContactName,
    phone: contactInfo?.primary_phone ?? "",
    avatarColor: meta.hex,
    lastSeen: t(language, "canal.enLinea"),
  };

  const onSelect = (id: string) => {
    setActiveId(id || null);
  };
  const onSend = () => {
    if (!activeId || !composer.trim()) return;
    setComposer("");
  };

  const actions: ChannelFrameActions = {
    templates: true,
    cotizacion: true,
    pagos: true,
    ordenes: true,
  };

  return (
    <div className="view">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/channels" })}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <span className="text-primary"><ChannelIcon kind={kind} className="size-6" /></span>
        <h2 className="text-lg font-bold text-foreground">{t(language, "canal." + kind)}</h2>
      </div>

      <ChannelFrame
        lang={language}
        title={t(language, "canal." + kind)}
        accent={meta.hsl}
        icon={
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <ChannelIcon kind={kind} className="size-5" />
          </span>
        }
        actions={actions}
        composerValue={composer}
        onComposerChange={setComposer}
        onSend={onSend}
      >
        <BrandPhone kind={meta.brand}>
          <PhoneApp
            lang={language}
            meta={meta}
            chats={chats}
            activeId={activeId}
            msgs={activeMsgs}
            onSelect={onSelect}
            onOpenContact={() => setContactBarOpen(true)}
            contact={activeChat ? activeContact : undefined}
          />
        </BrandPhone>
      </ChannelFrame>

      <WaContactBar
        open={contactBarOpen}
        contact={activeChat ? activeContact : null}
        onClose={() => setContactBarOpen(false)}
      />
    </div>
  );
}

function contactNameFor(contactId: string | null): string {
  if (!contactId) return "Cliente";
  return `Cliente ${contactId.slice(0, 6)}`;
}