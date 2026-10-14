/**
 * HUB by Raisen — Vista de canal individual.
 * CUALQUIER canal (no solo WhatsApp) usa:
 *   - ChannelFrame: layout horizontal con celular a la izquierda y
 *     pestañas de negocio + composer a la derecha.
 *   - BrandPhone: celular de la marca con la lista de conversaciones del canal.
 *   - Click hilo -> se muestra el chat interno de esa conversación dentro del celular.
 *   - Sidebar de contacto al pulsar el avatar (WaContactBar).
 *   - Las pestañas de negocio muestran datos reales (cotizaciones, pagos, contactos, etc)
 *     o estado vacío honesto (N5).
 * Datos reales via Supabase REST (conversaciones/mensajes/contactos). Sin datos mock.
 * i18n completo.
 */
import { useState, useMemo, type ReactNode } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { ChannelIcon, type ChannelKind } from "@/components/ui/channel-icon";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import type { Mensaje, RowQuote, RowPayment, RowOrder } from "@/lib/types";
import {
  WaContactBar,
  waChatFrom,
  type WaChat, type WaMsg, type WaContact,
} from "@/components/dashboard/whatsapp-phone";
import {
  ChannelFrame,
  ChannelTab,
  ChatAmplified,
} from "@/components/dashboard/channel-frame";
import { BrandPhone, type BrandKind } from "@/components/dashboard/brand-phone";

export const CanalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/$channelId",
  component: CanalViewPage,
});

const MESSAGE_COLS = ["id", "conversation_id", "sender_type", "sender_id", "content", "message_type", "created_at"];
const CONV_COLS = ["id", "contact_id", "primary_channel", "subject", "last_message_at"];
const CONTACT_COLS = [
  "id", "display_name", "primary_phone", "primary_email",
  "segment", "ltv_usd", "total_orders", "preferred_channel",
];
const AGENT_COLS = ["id", "display_name", "role", "status"];
const TEMPLATE_COLS = ["id", "name", "channel", "category", "body_preview"];
const DOC_COLS = ["id", "conversation_id", "file_name", "file_type", "file_size", "created_at"];

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
    const rows = (await res.json()) as unknown as Array<{
      id: string; display_name: string | null; primary_phone: string | null; primary_email: string | null;
      segment: string | null; ltv_usd: number | null; total_orders: number | null; preferred_channel: string | null;
    }>;
    return rows[0] ?? null;
  } catch { return null; }
}

/* ── Fetchers para las pestañas de negocio ──────────────────── */

async function fetchAgents() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/agents?select=${enc(AGENT_COLS.join(","))}&order=display_name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; display_name: string | null; role: string | null; status: string | null }>;
  } catch { return []; }
}

async function fetchTemplates() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/templates?select=${enc(TEMPLATE_COLS.join(","))}&order=name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; name: string | null; channel: string | null; category: string | null; body_preview: string | null }>;
  } catch { return []; }
}

async function fetchDocuments() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/attachments?select=${enc(DOC_COLS.join(","))}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; conversation_id: string | null; file_name: string | null; file_type: string | null; file_size: number | null; created_at: string | null }>;
  } catch { return []; }
}

/* Fetchers scoped al cliente del hilo activo. */
async function fetchQuotesForContact(contactId: string): Promise<RowQuote[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = ["id", "contact_id", "status", "total_amount", "currency", "created_at", "expires_at"].join(",");
  const url = `${base}/quotes?select=${enc(cols)}&contact_id=eq.${enc(contactId)}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowQuote[];
  } catch { return []; }
}

async function fetchOrdersForContact(contactId: string): Promise<RowOrder[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = ["id", "quote_id", "contact_id", "status", "total_amount", "currency", "created_at", "paid_at"].join(",");
  const url = `${base}/orders?select=${enc(cols)}&contact_id=eq.${enc(contactId)}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowOrder[];
  } catch { return []; }
}

async function fetchPaymentsForContact(contactId: string): Promise<RowPayment[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  // Los pagos no exponen contact_id: se resuelven vía las órdenes y cotizaciones
  // del contacto filtrando por order_id.in / quote_id.in.
  try {
    const [orders, quotes] = await Promise.all([
      fetchOrdersForContact(contactId),
      fetchQuotesForContact(contactId),
    ]);
    const orderIds = orders.map((o) => o.id);
    const quoteIds = quotes.map((q) => q.id);
    if (orderIds.length === 0 && quoteIds.length === 0) return [];
    const clauses: string[] = [];
    if (orderIds.length > 0) clauses.push(`order_id.in.(${orderIds.map((id) => encodeURIComponent(id)).join(",")})`);
    if (quoteIds.length > 0) clauses.push(`quote_id.in.(${quoteIds.map((id) => encodeURIComponent(id)).join(",")})`);
    const cols = ["id", "order_id", "quote_id", "status", "amount", "currency", "provider", "created_at"].join(",");
    const url = `${base}/payments?select=${enc(cols)}&or=(${clauses.join(",")})&order=created_at.desc&limit=50`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowPayment[];
  } catch { return []; }
}

/** Información cargada del contacto del hilo activo (ficha 360). */
type ActiveContactInfo = NonNullable<Awaited<ReturnType<typeof fetchContact>>>;

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

/* ── Componentes de contenido para cada pestaña ──────────────── */

function TabContent({
  lang, activeTab, accent, contactId, contactInfo,
}: {
  lang: Idioma;
  activeTab: ChannelTab | undefined;
  accent: string;
  contactId: string | null;
  contactInfo: ActiveContactInfo | null;
}): ReactNode {
  const hasHilo = !!contactId;

  // Vistas auxiliares (no scoped al cliente).
  const { data: agents } = useQuery({
    queryKey: ["channel-agents"],
    queryFn: fetchAgents,
    staleTime: 30_000,
  });
  const { data: templates } = useQuery({
    queryKey: ["channel-templates"],
    queryFn: fetchTemplates,
    staleTime: 30_000,
  });
  const { data: documents } = useQuery({
    queryKey: ["channel-documents"],
    queryFn: fetchDocuments,
    staleTime: 30_000,
  });

  // Vistas scoped al cliente del hilo activo.
  const { data: quotes } = useQuery({
    queryKey: ["channel-quotes-contact", contactId],
    queryFn: () => fetchQuotesForContact(contactId as string),
    enabled: !!contactId,
    staleTime: 30_000,
  });
  const { data: orders } = useQuery({
    queryKey: ["channel-orders-contact", contactId],
    queryFn: () => fetchOrdersForContact(contactId as string),
    enabled: !!contactId,
    staleTime: 30_000,
  });
  const { data: payments } = useQuery({
    queryKey: ["channel-payments-contact", contactId],
    queryFn: () => fetchPaymentsForContact(contactId as string),
    enabled: !!contactId,
    staleTime: 30_000,
  });

  if (!activeTab) {
    return <ChatAmplified lang={lang} />;
  }

  const sinHilo = (
    <Card>
      <CardBody className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{t(lang, "canal.sinHilo")}</p>
      </CardBody>
    </Card>
  );
  const sinContacto = (
    <Card>
      <CardBody className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{t(lang, "canal.sinContacto")}</p>
      </CardBody>
    </Card>
  );
  const accentStyle = { borderLeft: `3px solid hsl(${accent})`, paddingLeft: 10 };

  switch (activeTab) {
    case "agentes":
      return (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.agentes")}</h4>
          {!agents || agents.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "dash.sinRegistros")}</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {agents.map((a) => (
                <li key={a.id} style={accentStyle}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{a.display_name ?? "—"}</span>
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 6 }}>{a.role ?? ""}</span>
                  <span style={{ fontSize: 11, color: a.status === "online" ? "#22c55e" : "var(--muted-foreground)", float: "right" }}>{a.status ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "contactos":
      // Ficha del CONTACTO del hilo activo.
      if (!hasHilo) return sinHilo;
      if (!contactInfo) return sinContacto;
      return (
        <div className="space-y-3">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})` }}>{t(lang, "canal.dataContacto")}</h4>
          <ContactFichaCard lang={lang} contact={contactInfo} />
        </div>
      );

    case "plantillas":
      return (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.plantillas")}</h4>
          {!templates || templates.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "dash.sinRegistros")}</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {templates.map((tpl) => (
                <li key={tpl.id} style={accentStyle}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{tpl.name ?? "—"}</span>
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 6 }}>{tpl.category ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "cotizacion":
      // Cotizaciones del CONTACTO del hilo, formato /quotes.
      if (!hasHilo) return sinHilo;
      return (
        <div className="space-y-3">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.cotizacion")}</h4>
          {!quotes || quotes.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "quotes.empty")}</p>
          ) : (
            <div className="grid gap-3">
              {quotes.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{t(lang, "quotes.total")}: {q.currency} {q.total_amount.toFixed(2)}</CardTitle>
                    <Badge tone={QUOTE_STATUS_TONE[q.status] ?? "warn"}>
                      {t(lang, "quotes.status." + q.status)}
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <Row label={t(lang, "quotes.date")} value={new Date(q.created_at).toLocaleDateString()} />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      );

    case "factura":
      // Facturas/órdenes del contacto del hilo, formato /orders.
      if (!hasHilo) return sinHilo;
      return (
        <div className="space-y-3">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.factura")}</h4>
          {!orders || orders.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "orders.empty")}</p>
          ) : (
            <div className="grid gap-3">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{t(lang, "orders.total")}: {o.currency} {o.total_amount.toFixed(2)}</CardTitle>
                    <Badge tone={ORDER_STATUS_TONE[o.status] ?? "warn"}>
                      {t(lang, "orders.status." + o.status)}
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <Row label={t(lang, "orders.quote")} value={o.quote_id ? o.quote_id.slice(0, 8) + "..." : "—"} />
                    <Row label={t(lang, "orders.date")} value={new Date(o.created_at).toLocaleDateString()} />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      );

    case "pagos":
      // Pagos del contacto del hilo, formato /payments.
      if (!hasHilo) return sinHilo;
      return (
        <div className="space-y-3">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.pagos")}</h4>
          {!payments || payments.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "payments.empty")}</p>
          ) : (
            <div className="grid gap-3">
              {payments.map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{p.currency} {p.amount.toFixed(2)}</CardTitle>
                    <Badge tone={PAYMENT_STATUS_TONE[p.status] ?? "warn"}>
                      {t(lang, "payments.status." + p.status)}
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <Row label={t(lang, "payments.provider")} value={p.provider ?? "—"} />
                    <Row label={t(lang, "payments.order")} value={p.order_id ? p.order_id.slice(0, 8) + "..." : "—"} />
                    <Row label={t(lang, "payments.date")} value={new Date(p.created_at).toLocaleDateString()} />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      );

    case "documentos":
      return (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{t(lang, "cf.documentos")}</h4>
          {!documents || documents.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t(lang, "dash.sinRegistros")}</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {documents.map((d) => (
                <li key={d.id} style={accentStyle}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{d.file_name ?? "—"}</span>
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 6 }}>{d.file_type ?? ""}</span>
                  {d.file_size != null ? (
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", float: "right" }}>
                      {(d.file_size / 1024).toFixed(0)} KB
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    default:
      return <ChatAmplified lang={lang} />;
  }
}

/* Ficha 360 del cliente del hilo activo. */
function ContactFichaCard({ lang, contact }: { lang: Idioma; contact: ActiveContactInfo }) {
  const segment = contact.segment ? t(lang, "contacts.segment." + contact.segment) : "—";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{contact.display_name ?? "—"}</CardTitle>
        <Badge tone={contact.segment ? "hub" : "warn"} dot>{segment}</Badge>
      </CardHeader>
      <CardBody>
        <Row label={t(lang, "contacts.phone")} value={contact.primary_phone ?? "—"} />
        <Row label={t(lang, "contacts.email")} value={contact.primary_email ?? "—"} />
        <Row label={t(lang, "contacts.segment")} value={segment} />
        <Row label={t(lang, "contacts.ltv")} value={`$${(contact.ltv_usd ?? 0).toFixed(2)}`} />
        <Row label={t(lang, "contacts.orders")} value={String(contact.total_orders ?? 0)} />
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

const QUOTE_STATUS_TONE: Record<string, BadgeTone> = {
  draft: "warn", sent: "hub", accepted: "success", rejected: "danger", expired: "process",
};
const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn", confirmed: "hub", paid: "success", shipped: "process", delivered: "success", cancelled: "danger",
};
const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn", completed: "success", failed: "danger", refunded: "process",
};

function CanalViewPage() {
  const { channelId } = useParams({ from: CanalRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const kind = channelId as ChannelKind;
  const meta = CHANNEL_META[kind] ?? CHANNEL_META.webchat;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [contactBarOpen, setContactBarOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [activeTab, setActiveTab] = useState<ChannelTab | undefined>(undefined);

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
  const threadContactId = useMemo(() => {
    if (!activeId) return null;
    const conv = (conversations ?? []).find((c) => c.id === activeId);
    return conv?.contact_id ?? null;
  }, [conversations, activeId]);
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

  return (
    <div className="view">
      {/* Botón volver atrás */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/channels" })}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <span className="text-primary"><ChannelIcon kind={kind} className="size-5" /></span>
      </div>

      <ChannelFrame
        lang={language}
        accent={meta.hsl}
        active={activeTab}
        onTabChange={setActiveTab}
        composerValue={composer}
        onComposerChange={setComposer}
        onSend={onSend}
        composerContent={
          activeTab
            ? <TabContent lang={language} activeTab={activeTab} accent={meta.hsl} contactId={threadContactId} contactInfo={contactInfo ?? null} />
            : <AmplifiedChat lang={language} chat={activeChat} contact={activeContact} msgs={activeMsgs} meta={meta} onOpenContact={() => setContactBarOpen(true)} />
        }
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

/* Conversación ampliada del hilo seleccionado (panel derecho). */
function AmplifiedChat({ lang, chat, contact, msgs, meta, onOpenContact }: {
  lang: Idioma;
  chat: WaChat | null;
  contact: WaContact | undefined;
  msgs: readonly WaMsg[];
  meta: ChannelMeta;
  onOpenContact: () => void;
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
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
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