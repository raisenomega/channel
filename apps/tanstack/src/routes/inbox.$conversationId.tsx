/**
 * HUB by Raisen — Hilo de chat + ficha 360 del contacto.
 * Ruta dinamica /inbox/$conversationId. Datos reales via Supabase REST (N5).
 * Sin emojis (E0). C4 (<=75 lineas por archivo).
 */
import { useState, useEffect } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Mensaje, Contact360, RowContact, RowQuote, RowOrder, RowPayment } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const ConversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox/$conversationId",
  component: ConversationPage,
});

const MESSAGE_COLS = [
  "id", "conversation_id", "sender_type", "sender_id",
  "content", "message_type", "created_at",
];

const CONTACT_COLS = [
  "id", "display_name", "primary_phone", "primary_email", "segment",
  "ltv_usd", "total_orders", "preferred_channel",
  "marketing_opt_in", "do_not_contact",
];

const ORDER_COLS = ["id", "status", "total_amount", "currency", "created_at"];
const PAYMENT_COLS = ["id", "status", "amount", "currency", "created_at"];

function enc(v: string): string {
  return encodeURIComponent(v);
}

async function fetchMessages(conversationId: string): Promise<Mensaje[]> {
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
      id: String(r.id),
      conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_id ? String(r.sender_id) : null,
      content: String(r.content),
      messageType: String(r.message_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function fetchContact360(contactId: string): Promise<Contact360 | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;

  const contactUrl = `${base}/contacts?id=eq.${enc(contactId)}&select=${enc(CONTACT_COLS.join(","))}&limit=1`;
  try {
    const cr = await fetch(contactUrl, { headers });
    if (!cr.ok) return null;
    const crows = (await cr.json()) as RowContact[];
    const row = crows[0];
    if (!row) return null;

    const convUrl = `${base}/conversations?contact_id=eq.${enc(contactId)}&select=id,primary_channel,status,last_message_at&order=last_message_at.desc&limit=5`;
    const quoteUrl = `${base}/quotes?contact_id=eq.${enc(contactId)}&select=${enc(ORDER_COLS.join(","))}&order=created_at.desc&limit=5`;
    const orderUrl = `${base}/orders?contact_id=eq.${enc(contactId)}&select=${enc(ORDER_COLS.join(","))}&order=created_at.desc&limit=5`;

    const [convR, quoteR, orderR] = await Promise.all([
      fetch(convUrl, { headers }),
      fetch(quoteUrl, { headers }),
      fetch(orderUrl, { headers }),
    ]);

    const conversaciones = convR.ok ? (await convR.json() as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id), channel: String(r.primary_channel ?? ""), status: String(r.status ?? ""),
      lastMessageAt: String(r.last_message_at ?? new Date().toISOString()),
    })) : [];

    const cotizaciones = quoteR.ok ? (await quoteR.json() as RowQuote[]).map((q) => ({
      id: String(q.id), status: String(q.status), totalAmount: Number(q.total_amount ?? 0),
      currency: String(q.currency ?? "USD"), createdAt: String(q.created_at ?? new Date().toISOString()),
    })) : [];

    const ordenesRaw = orderR.ok ? (await orderR.json() as RowOrder[]) : [];
    const ordenes = ordenesRaw.map((o) => ({
      id: String(o.id), status: String(o.status), totalAmount: Number(o.total_amount ?? 0),
      currency: String(o.currency ?? "USD"), createdAt: String(o.created_at ?? new Date().toISOString()),
    }));

    const orderIds = ordenesRaw.slice(0, 5).map((o) => String(o.id)).filter(Boolean);
    let pagos: Array<{ id: string; status: string; amount: number; currency: string; createdAt: string }> = [];
    if (orderIds.length) {
      const payUrl = `${base}/payments?order_id=in.(${orderIds.map(enc).join(",")})&select=${enc(PAYMENT_COLS.join(","))}&order=created_at.desc&limit=10`;
      const payR = await fetch(payUrl, { headers });
      if (payR.ok) {
        const payRows = (await payR.json() as RowPayment[]);
        pagos = payRows.map((p) => ({
          id: String(p.id), status: String(p.status), amount: Number(p.amount ?? 0),
          currency: String(p.currency ?? "USD"), createdAt: String(p.created_at ?? new Date().toISOString()),
        }));
      }
    }

    return {
      contactId: String(row.id),
      displayName: String(row.display_name ?? "Contacto"),
      primaryPhone: row.primary_phone ? String(row.primary_phone) : null,
      primaryEmail: row.primary_email ? String(row.primary_email) : null,
      segment: row.segment ? String(row.segment) : null,
      ltvUsd: Number(row.ltv_usd ?? 0),
      totalOrders: Number(row.total_orders ?? 0),
      preferredChannel: row.preferred_channel ? String(row.preferred_channel) : null,
      marketingOptIn: row.marketing_opt_in === true,
      doNotContact: row.do_not_contact === true,
      conversaciones,
      cotizaciones,
      ordenes,
      pagos,
    };
  } catch {
    return null;
  }
}

function formatTime(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return t(lang, "inbox.justNow");
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${t(lang, "inbox.min")}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${t(lang, "inbox.hour")}`;
  return d.toLocaleDateString(lang === "es" ? "es" : "en", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function currency(v: number, mon: string, lang: Idioma): string {
  try {
    return v.toLocaleString(lang === "es" ? "es" : "en", { style: "currency", currency: mon || "USD" });
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

function dateStr(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "es" ? "es" : "en");
}

function initial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

function ConversationPage() {
  const { conversationId } = useParams({ from: ConversationRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    staleTime: 10_000,
  });

  const [contact360, setContact360] = useState<Contact360 | null | "loading">("loading");

  useEffect(() => {
    setContact360("loading");
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) { setContact360(null); return; }
    const cols = ["id", "contact_id"];
    fetch(`${base}/conversations?id=eq.${enc(conversationId)}&select=${enc(cols.join(","))}&limit=1`, { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: Array<{ contact_id: string | null }>) => {
        const cid = rows[0]?.contact_id;
        if (!cid) { setContact360(null); return; }
        void fetchContact360(String(cid)).then(setContact360);
      })
      .catch(() => setContact360(null));
  }, [conversationId]);

  async function handleSend() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true);
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (base && headers) {
      const body = {
        conversation_id: conversationId,
        sender_type: "agent",
        sender_id: "",
        content: text,
        message_type: "text",
      };
      try {
        const res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setComposerText("");
          void refetchMessages();
        }
      } catch {
        // Silencio: no mock data (N5).
      }
    }
    setSending(false);
  }

  return (
    <div className="dash-grid grid gap-4 mt-4">
      {/* Chat thread */}
      <ChatPanel
        conversationId={conversationId}
        messages={messages ?? []}
        language={language}
        onBack={() => void navigate({ to: "/inbox" })}
        composerText={composerText}
        setComposerText={setComposerText}
        onSend={handleSend}
        sending={sending}
      />

      {/* Ficha 360 */}
      <ContactPanel contact={contact360} language={language} />
    </div>
  );
}

function ChatPanel({
  conversationId, messages, language, onBack,
  composerText, setComposerText, onSend, sending,
}: {
  conversationId: string;
  messages: readonly Mensaje[];
  language: Idioma;
  onBack: () => void;
  composerText: string;
  setComposerText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <div className="rounded-2xl glass-card" data-chat-thread>
      <div className="flex items-center justify-between gap-3 border-b border-border/30 p-3">
        <div className="flex items-center gap-3">
          <Avatar name="Conversacion" size="sm" />
          <div className="nm">
            <p className="text-sm font-semibold text-foreground">
              #{conversationId.length > 8 ? conversationId.slice(0, 8) + "..." : conversationId}
            </p>
            <p className="text-xs text-muted-foreground">{t(language, "dash.conversaciones")}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t(language, "inbox.filtros")}
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="flex h-64 items-center justify-center px-6 text-sm text-muted-foreground">
          {t(language, "chat.empty")}
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={"chat-bubble" + (m.senderType === "contact" ? " contact" : "") + " ml-" + (m.senderType === "contact" ? "0" : "auto")}
            >
              <p className="text-sm">{m.content}</p>
              <span className="text-xs text-dim">{formatTime(m.createdAt, language)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border/30 p-3 flex gap-2">
        <textarea
          data-chat-input
          className="flex-1 rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm text-foreground resize-none"
          rows={2}
          placeholder={t(language, "chat.placeholder")}
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button
          data-chat-send
          variant="primary"
          size="sm"
          disabled={!composerText.trim() || sending}
          onClick={onSend}
        >
          {t(language, "chat.send")}
        </Button>
      </div>
    </div>
  );
}

function ContactPanel({ contact, language }: { contact: Contact360 | null | "loading"; language: Idioma }) {
  if (contact === "loading") {
    return (
      <div className="rounded-2xl glass-card p-4">
        <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "dash.ficha")}</h3>
        <p className="text-sm text-muted-foreground">{t(language, "dash.fichaCargando")}</p>
      </div>
    );
  }
  if (!contact) {
    return (
      <div className="rounded-2xl glass-card p-4">
        <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "dash.ficha")}</h3>
        <p className="text-sm text-muted-foreground">{t(language, "dash.fichaSinDatos")}</p>
      </div>
    );
  }

  const c = contact as Contact360;

  const segmentLabel = c.segment ? t(language, "dash.segmento." + c.segment) : "—";
  const ltv = currency(c.ltvUsd, "USD", language);
  const canal = c.preferredChannel ? t(language, "canal." + c.preferredChannel) : "—";
  const consent = c.doNotContact ? t(language, "dash.dnc") : t(language, "dash.ok");

  function fila(label: string, valor: string) {
    return (
      <div className="feat flex items-center gap-sm" style={{ padding: "7px 0", borderBottom: "1px solid hsl(var(--border) / 0.25)" }}>
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm ml-auto" style={{ color: valor !== "—" ? "hsl(var(--primary))" : "hsl(var(--text-dim))" }}>{valor}</span>
      </div>
    );
  }

  function seccionTitulo(titulo: string) {
    return (
      <div className="text-xs font-bold text-muted-foreground uppercase" style={{ letterSpacing: "0.06em", margin: "14px 0 4px" }}>
        {titulo}
      </div>
    );
  }

  function sinRegistros() {
    return <p className="text-sm text-muted-foreground" style={{ margin: "2px 0 6px" }}>{t(language, "dash.sinRegistros")}</p>;
  }

  const cotizaciones = c.cotizaciones.length === 0
    ? [sinRegistros()]
    : c.cotizaciones.slice(0, 3).map((q) =>
        fila(
          t(language, "dash.estado." + q.status) + " . " + dateStr(q.createdAt, language),
          currency(q.totalAmount, q.currency, language),
        )
      );

  const ordenes = c.ordenes.length === 0
    ? [sinRegistros()]
    : c.ordenes.slice(0, 3).map((o) =>
        fila(
          t(language, "dash.estado." + o.status) + " . " + dateStr(o.createdAt, language),
          currency(o.totalAmount, o.currency, language),
        )
      );

  const pagos = c.pagos.length === 0
    ? [sinRegistros()]
    : c.pagos.slice(0, 3).map((p) =>
        fila(t(language, "dash.estado." + p.status), currency(p.amount, p.currency, language))
      );

  return (
    <div className="rounded-2xl glass-card p-4" data-contact360>
      <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "dash.ficha")}</h3>

      <div className="flex items-center gap-2" style={{ padding: "14px 0" }}>
        <span
          className="flex size-10 items-center justify-center rounded-full font-bold text-background bg-primary"
        >
          {initial(c.displayName)}
        </span>
        <div className="nm flex-1 min-width-0">
          <div className="text-sm font-bold truncate text-foreground">{c.displayName}</div>
          <div className="text-xs text-muted-foreground">{c.primaryEmail ?? c.primaryPhone ?? "—"}</div>
        </div>
      </div>

      {fila(t(language, "dash.telefono"), c.primaryPhone ?? "—")}
      {fila(t(language, "dash.email"), c.primaryEmail ?? "—")}
      {fila(t(language, "dash.segmento"), segmentLabel)}
      {fila(t(language, "dash.pedidos"), String(c.totalOrders))}
      {fila(t(language, "dash.ltv"), ltv)}
      {fila(t(language, "dash.prefCanal"), canal)}
      {fila(t(language, "dash.consent"), consent)}

      {seccionTitulo(t(language, "dash.seccCotizaciones"))}
      {cotizaciones}
      {seccionTitulo(t(language, "dash.seccOrdenes"))}
      {ordenes}
      {seccionTitulo(t(language, "dash.seccPagos"))}
      {pagos}
    </div>
  );
}

export { ConversationRoute };