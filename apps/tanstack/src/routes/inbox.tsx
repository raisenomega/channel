/**
 * HUB by Raisen — Dashboard principal (/inbox).
 * KPIs reales desde Supabase REST, lista de conversaciones con filtros,
 * layout 3 paneles (lista | hilo | ficha 360). Sin datos mock (N5).
 */
import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { InboxItem, DashboardStats, RowConv } from "@/lib/types";
import { Kpi } from "@/components/ui/kpi";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

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

const COLOR_ESTADO: Readonly<Record<string, string>> = {
  open: "sev-success",
  pending: "sev-medium",
  snoozed: "sev-low",
  resolved: "sev-process",
};

function calcularStats(items: readonly InboxItem[]): DashboardStats {
  const porCanal: Record<string, number> = {};
  let sinAsignar = 0;
  let abiertas = 0;
  for (const it of items) {
    porCanal[it.channel] = (porCanal[it.channel] ?? 0) + 1;
    if (!it.assignedTo) sinAsignar += 1;
    if (it.status === "open") abiertas += 1;
  }
  return {
    total: items.length,
    porCanal,
    sinAsignar,
    abiertas,
    hasChannelsConnected: items.length > 0,
  };
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
  return d.toLocaleDateString(lang === "es" ? "es" : "en", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function InboxPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroSLA, setFiltroSLA] = useState<boolean | null>(null);

  const { data: items, isPending } = useQuery({
    queryKey: ["inbox"],
    queryFn: fetchInbox,
    staleTime: 30_000,
  });

  const itemsFiltrados = (items ?? []).filter((i) => {
    if (filtroCanal && i.channel !== filtroCanal) return false;
    if (filtroEstado && i.status !== filtroEstado) return false;
    if (filtroSLA === true && !i.slaViolated) return false;
    return true;
  });

  const stats = calcularStats(itemsFiltrados);
  const canalesActivos = CANALES.filter((c) => stats.porCanal[c] !== undefined);

  function toggleCanal(c: string) {
    setFiltroCanal(filtroCanal === c ? null : c);
  }
  function toggleEstado(e: string) {
    setFiltroEstado(filtroEstado === e ? null : e);
  }
  function toggleSLA() {
    setFiltroSLA(filtroSLA === true ? null : true);
  }
  function cleanFilters() {
    setFiltroCanal(null);
    setFiltroEstado(null);
    setFiltroSLA(null);
  }

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
      {/* KPIs */}
      <div className="kpis">
        <Kpi label={t(language, "kpi.tenant")} value="" hint={t(language, "dash.plan")} />
        <Kpi label={t(language, "dash.activas")} value={String(stats.abiertas)} />
        <Kpi label={t(language, "dash.sinAsignar")} value={String(stats.sinAsignar)} />
        <Kpi label={t(language, "dash.plan")} value={String(items?.length ?? 0)} hint={t(language, "inbox.total")} />
      </div>

      {/* Chips canales */}
      <div className="section">
        <span className="text-sm font-bold text-muted-foreground">{t(language, "inbox.channels")}</span>
        <span className="more text-xs">{t(language, "inbox.seeAll")}</span>
      </div>
      <div className="chips">
        {(canalesActivos.length ? canalesActivos : ["whatsapp", "email", "instagram"]).map((c) => (
          <button
            key={c}
            type="button"
            className={"chip" + (c === filtroCanal ? " active" : "")}
            onClick={() => toggleCanal(c)}
          >
            <span className="chip-name">{t(language, "canal." + c)}</span>
          </button>
        ))}
      </div>

      {/* Chips estado */}
      <div className="section">
        <span className="text-sm font-bold text-muted-foreground">{t(language, "inbox.filtros")}</span>
      </div>
      <div className="chips">
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            className={"chip" + (e === filtroEstado ? " active" : "")}
            onClick={() => toggleEstado(e)}
          >
            <span className={"chip-name " + COLOR_ESTADO[e]}>{t(language, "filtro.estado." + e)}</span>
          </button>
        ))}
        <button
          type="button"
          className={"chip" + (filtroSLA === true ? " active" : "")}
          onClick={toggleSLA}
        >
          <span className="chip-name sev-critical">{filtroSLA === true ? t(language, "filtro.sla.violated") : t(language, "inbox.filtros.sla")}</span>
        </button>
        <button type="button" className="chip" onClick={cleanFilters}>
          <span className="chip-name text-muted-foreground">{t(language, "filtro.clean")}</span>
        </button>
      </div>

      {/* 3 paneles o empty state */}
      {sinDatos ? (
        <div className="rounded-2xl border border-border/45 bg-card p-6 text-center mt-4">
          <div className="text-lg font-semibold text-foreground">
            {t(language, "dash.emptyTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(language, "dash.emptyBody")}
          </p>
          <Badge
            tone="hub"
            className="mt-3 cursor-pointer"
            onClick={() => void navigate({ to: "/channels" })}
          >
            {t(language, "dash.emptyAction")}
          </Badge>
        </div>
      ) : (
        <ListaConversaciones
          items={itemsFiltrados}
          language={language}
          onSelect={(id) => void navigate({ to: "/inbox/" + encodeURIComponent(id) })}
        />
      )}
    </div>
  );
}

function ListaConversaciones({
  items, language, onSelect,
}: {
  items: readonly InboxItem[];
  language: Idioma;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="dash-grid grid gap-4 mt-4">
      {/* Panel izquierdo: lista */}
      <div className="rounded-2xl border border-border/45 bg-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="section text-xs font-bold text-muted-foreground px-sm">
          {t(language, "dash.conversaciones")}
        </div>
        <div className="list">
          {items.map((item) => (
            <div
              key={item.conversationId}
              className="list-item flex items-center gap-2 p-sm px-lg"
              onClick={() => onSelect(item.conversationId)}
            >
              <Avatar name={item.contactName} size="sm" />
              <div className="nm flex-1 min-width-0">
                <div className="h flex items-center gap-sm">
                  <span className="text-sm font-bold truncate text-foreground">{item.contactName}</span>
                  {item.slaViolated ? <Badge tone="danger">SLA</Badge> : null}
                  <span className="text-xs text-dim ml-auto">
                    {formatTime(item.lastMessageAt, language)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">{item.lastMessage}</div>
              </div>
              {item.unreadCount > 0 ? (
                <Badge tone="hub">{String(item.unreadCount)}</Badge>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Panel central: hilo */}
      <div className="rounded-2xl border border-border/45 bg-card" data-chat-thread data-empty360>
        <div className="section text-xs font-bold text-muted-foreground px-sm">
          {t(language, "dash.conversaciones")}
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{t(language, "chat.empty")}</p>
        </div>
      </div>

      {/* Panel derecho: ficha 360 */}
      <div className="rounded-2xl border border-border/45 bg-card" data-contact360 data-empty360>
        <div className="section text-xs font-bold text-muted-foreground px-sm">
          {t(language, "dash.ficha")}
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{t(language, "dash.fichaEmpty")}</p>
        </div>
      </div>
    </div>
  );
}

export { InboxRoute };