/**
 * HUB by Raisen — Ultra-Dashboard /inbox (BentoBox glass).
 * KPIs reales desde Supabase REST, pendientes derivados reales, sin datos mock (N5).
 */
import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { InboxItem, DashboardStats, RowConv } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { BentoKpi, DistribucionCanales, AnilloSLA, Pendientes, BentoTitle } from "@/components/dashboard/bentobox-dashboard";
import { ChannelOverlay } from "@/components/dashboard/channel-overlay";
import { ChannelFrame } from "@/components/dashboard/channel-frame";
import { BrandPhone, type BrandKind } from "@/components/dashboard/brand-phone";

const IconBars = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
    <line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="15" x2="17" y2="15" /><line x1="3" y1="5" x2="17" y2="5" />
  </svg>
);
const IconDona = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3" fill="currentColor" stroke="none" />
  </svg>
);
const IconFlag = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 17V3h9l-1.5 3L14 9H5" />
  </svg>
);
const IconList = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
    <line x1="3" y1="6" x2="17" y2="6" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" />
  </svg>
);

const InboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: InboxPage,
});

const CANALES: readonly string[] = [
  "whatsapp", "email", "instagram", "facebook",
  "telegram", "sms", "x", "linkedin", "webchat",
];

const ESTADOS: readonly string[] = ["open", "pending", "snoozed", "resolved"];

function calcularStats(items: readonly InboxItem[]): DashboardStats {
  const porCanal: Record<string, number> = {};
  let sinAsignar = 0;
  let abiertas = 0;
  for (const it of items) {
    porCanal[it.channel] = (porCanal[it.channel] ?? 0) + 1;
    if (!it.assignedTo) sinAsignar += 1;
    if (it.status === "open") abiertas += 1;
  }
  return { total: items.length, porCanal, sinAsignar, abiertas, hasChannelsConnected: items.length > 0 };
}

function mapearModo(m: string | null): InboxItem["mode"] {
  const v = String(m ?? "human");
  if (v === "assistant" || v === "copilot" || v === "autonomous" || v === "escalated" || v === "human") return v;
  return "human";
}

function desdeRow(r: RowConv): InboxItem {
  const contactId = r.contact_id ? String(r.contact_id) : null;
  const contactName = contactId && contactId.length > 8 ? "Contacto" : (contactId ?? "Contacto");
  return {
    conversationId: String(r.id),
    contactId,
    contactName,
    channel: String(r.primary_channel ?? "whatsapp"),
    lastMessage: String(r.subject ?? "Conversacion"),
    lastMessageAt: r.last_message_at ?? new Date().toISOString(),
    unreadCount: 0,
    status: String(r.status ?? "open"),
    assignedTo: r.assigned_agent_id ? "Asignado" : null,
    slaViolated: r.sla_violated === true,
    mode: mapearModo(r.operation_mode),
  };
}

async function fetchInbox(): Promise<InboxItem[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = [
    "id", "contact_id", "status", "operation_mode", "primary_channel",
    "last_message_at", "assigned_agent_id", "sla_violated",
    "total_messages", "subject",
  ];
  const url = `${base}/conversations?select=${encodeURIComponent(cols.join(","))}&order=last_message_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as RowConv[];
    return filas.map(desdeRow);
  } catch {
    return [];
  }
}

function formatTime(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return t(lang, "inbox.justNow");
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${t(lang, "inbox.min")}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${t(lang, "inbox.hour")}`;
  return d.toLocaleDateString(lang === "es" ? "es" : "en", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ────────────────────────────────────────────
   Página flotante del canal dentro del overlay
   (ChannelFrame + BrandPhone, simplificada).
   Muestra el canal activo sin salir del inbox.
   ──────────────────────────────────────────── */

/** Acento (triplete HSL) y marca de celular por canal activo. */
const OVERLAY_META: Record<string, { accent: string; brand: BrandKind }> = {
  whatsapp: { accent: "142 70% 28%", brand: "whatsapp" },
  email:    { accent: "4 82% 56%",  brand: "gmail" },
  instagram:{ accent: "332 72% 50%",brand: "instagram" },
  facebook: { accent: "221 88% 53%",brand: "facebook" },
  telegram: { accent: "201 78% 52%",brand: "telegram" },
  sms:      { accent: "122 39% 49%",brand: "sms" },
  x:        { accent: "210 60% 55%",brand: "x" },
  linkedin: { accent: "203 89% 40%",brand: "linkedin" },
  webchat:  { accent: "240 100% 69%",brand: "webchat" },
};

function FloatingChannel({ channel, items, lang }: {
  channel: string;
  items: readonly InboxItem[];
  lang: Idioma;
}) {
  const meta: { accent: string; brand: BrandKind } =
    OVERLAY_META[channel] ?? { accent: "142 70% 28%", brand: "whatsapp" };
  const [activeId, setActiveId] = useState<string | null>(null);
  const convos = items.filter((i) => i.channel === channel);
  const active = convos.find((c) => c.conversationId === activeId) ?? null;

  return (
    <ChannelFrame lang={lang} accent={meta.accent}>
      <BrandPhone kind={meta.brand}>
        <div className="wa-root" style={{ height: "100%" }}>
          {activeId && active ? (
            <ConversacionMini item={active} onBack={() => setActiveId(null)} lang={lang} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
              <p style={{ margin: "6px 12px 2px", fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
                {t(lang, "canal." + channel)}
              </p>
              {convos.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: 12, opacity: 0.7, padding: 18 }}>
                  {t(lang, "dash.emptyBody")}
                </p>
              ) : (
                convos.map((c) => (
                  <div
                    key={c.conversationId}
                    onClick={() => setActiveId(c.conversationId)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)", cursor: "pointer" }}
                  >
                    <Avatar name={c.contactName} size="sm" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.contactName}</span>
                        <span style={{ fontSize: 10.5, opacity: 0.7, flexShrink: 0 }}>{formatTime(c.lastMessageAt, lang)}</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessage}</div>
                    </div>
                    {c.slaViolated ? <Badge tone="danger">SLA</Badge> : null}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </BrandPhone>
    </ChannelFrame>
  );
}

/** Chat simplificado de la conversación activa dentro del celular. */
function ConversacionMini({ item, onBack, lang }: {
  item: InboxItem;
  onBack: () => void;
  lang: Idioma;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#075e54", color: "#fff", flexShrink: 0 }}>
        <span onClick={onBack} style={{ cursor: "pointer", fontSize: 18, lineHeight: 1 }}>‹</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.contactName}</span>
        <span style={{ fontSize: 11, opacity: 0.9 }}>{t(lang, "canal.enLinea")}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ maxWidth: "80%", alignSelf: "flex-start", background: "#ffffff", color: "#1f2926", padding: "7px 10px", borderRadius: 10, fontSize: 13, lineHeight: 1.35, boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}>
          {item.lastMessage}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, padding: 8, flexShrink: 0 }}>
        <input readOnly={true} defaultValue="" placeholder={t(lang, "chat.placeholder")} style={{ flex: 1, borderRadius: 999, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", padding: "7px 12px", fontSize: 13, outline: "none" }} />
      </div>
    </div>
  );
}

function InboxPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroSLA, setFiltroSLA] = useState<boolean | null>(null);
  const [openChannel, setOpenChannel] = useState<string | null>(null); // canal abierto en overlay (null = cerrado)

  const { data: items, isPending } = useQuery({ queryKey: ["inbox"], queryFn: fetchInbox, staleTime: 30_000 });

  const itemsFiltrados = (items ?? []).filter((i) => {
    if (filtroCanal && i.channel !== filtroCanal) return false;
    if (filtroEstado && i.status !== filtroEstado) return false;
    if (filtroSLA === true && !i.slaViolated) return false;
    return true;
  });

  const stats = calcularStats(itemsFiltrados);
  const canalesActivos = CANALES.filter((c) => stats.porCanal[c] !== undefined);

  function toggleEstado(e: string) { setFiltroEstado(filtroEstado === e ? null : e); }
  function toggleSLA() { setFiltroSLA(filtroSLA === true ? null : true); }
  function cleanFilters() { setFiltroCanal(null); setFiltroEstado(null); setFiltroSLA(null); }

  if (isPending) {
    return (
      <div className="view">
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "inbox.active")}…
        </div>
      </div>
    );
  }

  const sinDatos = items === undefined || items.length === 0;

  return (
    <div className="view">
      {/* FILA 1 — KPIs vitals glass */}
      <div className="bento">
        <BentoKpi label={t(language, "kpi.tenant")} num="" unit={t(language, "dash.plan")} />
        <BentoKpi label={t(language, "dash.activas")} num={stats.abiertas} trend={t(language, "dash.vivas")} />
        <BentoKpi label={t(language, "dash.sinAsignar")} num={stats.sinAsignar} trend={t(language, "dash.pend.asignar")} down />
        <BentoKpi label={t(language, "inbox.total")} num={items?.length ?? 0} unit={t(language, "inbox.min")} />
      </div>

      {/* FILA 2 — Dashboard: distribucion canales + anillo SLA + pendientes */}
      <div className="bento mt-4">
        <div className="bento-card bento-col-4">
          <BentoTitle icon={<IconBars />} label={t(language, "dash.distribucion")} />
          {sinDatos
            ? <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            : <DistribucionCanales stats={stats} lang={language} />}
        </div>

        <div className="bento-card bento-col-4">
          <BentoTitle icon={<IconDona />} label={t(language, "dash.slaTitulo")} />
          {sinDatos
            ? <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            : <AnilloSLA items={itemsFiltrados} lang={language} />}
        </div>

        <div className="bento-card bento-col-4">
          <BentoTitle icon={<IconFlag />} label={t(language, "dash.pendientes")} />
          {sinDatos
            ? <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            : <Pendientes items={itemsFiltrados} lang={language} />}
        </div>
      </div>

      {/* FILER de canales/estado (sobre glass) */}
      <div className="bento-card bento-col-12 mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(language, "inbox.channels")}:</span>
          {(canalesActivos.length ? canalesActivos : ["whatsapp", "email", "instagram"]).map((c) => (
            <button key={c} type="button"
              className="chip"
              onClick={() => setOpenChannel(c)}>
              <span className="chip-name">{t(language, "canal." + c)}</span>
            </button>
          ))}
          {ESTADOS.map((e) => (
            <button key={e} type="button"
              className={"chip" + (e === filtroEstado ? " active" : "")}
              onClick={() => toggleEstado(e)}>
              <span className="chip-name">{t(language, "filtro.estado." + e)}</span>
            </button>
          ))}
          <button type="button" className={"chip" + (filtroSLA === true ? " active" : "")} onClick={toggleSLA}>
            <span className="chip-name">{filtroSLA === true ? t(language, "filtro.sla.violated") : t(language, "inbox.filtros.sla")}</span>
          </button>
          <button type="button" className="chip" onClick={cleanFilters}>
            <span className="chip-name text-muted-foreground">{t(language, "filtro.clean")}</span>
          </button>
        </div>
      </div>

      {/* CONVERSACIONES */}
      <div className="bento mt-4">
        <div className="bento-card bento-col-12">
          <BentoTitle icon={<IconList />} label={t(language, "dash.conversaciones")}
            right={<Badge tone="hub">{String(itemsFiltrados.length)}</Badge>} />
          {sinDatos ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="text-lg font-semibold text-foreground">{t(language, "dash.emptyTitle")}</div>
              <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
              <Badge tone="hub" className="cursor-pointer"
                onClick={() => void navigate({ to: "/channels" })}>
                {t(language, "dash.emptyAction")}
              </Badge>
            </div>
          ) : (
            <div className="grid gap-2">
              {itemsFiltrados.map((item) => (
                <div key={item.conversationId}
                  className="flex items-center gap-2 rounded-2xl border border-border/30 bg-card-soft/40 p-2.5 hover:border-primary/50"
                  onClick={() => void navigate({ to: "/inbox/" + encodeURIComponent(item.conversationId) })}>
                  <Avatar name={item.contactName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">{item.contactName}</span>
                      {item.slaViolated ? <Badge tone="danger">SLA</Badge> : null}
                      <span className="ml-auto text-xs text-dim">{formatTime(item.lastMessageAt, language)}</span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{item.lastMessage}</div>
                  </div>
                  {item.unreadCount > 0 ? <Badge tone="hub">{String(item.unreadCount)}</Badge> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay flotante de canal: se abre al pulsar un chip de canal, sin navegar fuera */}
      <ChannelOverlay
        open={openChannel !== null}
        selected={openChannel ?? "whatsapp"}
        onSelect={(k) => { setOpenChannel(k); }}
        onClose={() => { setOpenChannel(null); }}
      >
        {openChannel ? (
          <FloatingChannel channel={openChannel} items={itemsFiltrados} lang={language} />
        ) : null}
      </ChannelOverlay>
    </div>
  );
}

export { InboxRoute };