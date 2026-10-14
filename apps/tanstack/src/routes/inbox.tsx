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

const ICONO_BARS = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><line x1="3" y1="5" x2="17" y2="5"/></svg>';
const ICONO_DONA = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3" fill="currentColor" stroke="none"/></svg>';
const ICONO_FLAG = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 17V3h9l-1.5 3L14 9H5"/></svg>';
const ICONO_LIST = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></svg>';

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

function InboxPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroSLA, setFiltroSLA] = useState<boolean | null>(null);

  const { data: items, isPending } = useQuery({ queryKey: ["inbox"], queryFn: fetchInbox, staleTime: 30_000 });

  const itemsFiltrados = (items ?? []).filter((i) => {
    if (filtroCanal && i.channel !== filtroCanal) return false;
    if (filtroEstado && i.status !== filtroEstado) return false;
    if (filtroSLA === true && !i.slaViolated) return false;
    return true;
  });

  const stats = calcularStats(itemsFiltrados);
  const canalesActivos = CANALES.filter((c) => stats.porCanal[c] !== undefined);

  function toggleCanal(c: string) { setFiltroCanal(filtroCanal === c ? null : c); }
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
          <BentoTitle icon={ICONO_BARS} label={t(language, "dash.distribucion")} />
          {sinDatos
            ? <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            : <DistribucionCanales stats={stats} lang={language} />}
        </div>

        <div className="bento-card bento-col-4">
          <BentoTitle icon={ICONO_DONA} label={t(language, "dash.slaTitulo")} />
          {sinDatos
            ? <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            : <AnilloSLA items={itemsFiltrados} lang={language} />}
        </div>

        <div className="bento-card bento-col-4">
          <BentoTitle icon={ICONO_FLAG} label={t(language, "dash.pendientes")} />
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
              className={"chip" + (c === filtroCanal ? " active" : "")}
              onClick={() => toggleCanal(c)}>
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
          <BentoTitle icon={ICONO_LIST} label={t(language, "dash.conversaciones")}
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
    </div>
  );
}

export { InboxRoute };