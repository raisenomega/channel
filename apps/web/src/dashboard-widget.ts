/**
 * HUB by Raisen — Panel dashboard principal (vista Inbox).
 * KPIs reales derivados del tenant; estados vacios honestos (P1/N5).
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { InboxItem, AppContext } from "./types.ts";
import { renderInboxList } from "./inbox-widget.ts";
import { t, type Idioma } from "./i18n.ts";

const CANALES: readonly string[] = ["whatsapp", "email", "instagram", "facebook", "telegram", "sms", "x", "linkedin", "webchat"];

export interface DashboardStats {
  readonly total: number;
  readonly porCanal: Readonly<Record<string, number>>;
  readonly sinAsignar: number;
  readonly abiertas: number;
  readonly hasChannelsConnected: boolean;
}

export function calcularStats(items: readonly InboxItem[]): DashboardStats {
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

function canalNombre(canal: string, lang: Idioma): string {
  const clave = `canal.${canal}`;
  const traducido = t(lang, clave);
  return traducido === clave ? canal : traducido;
}

function chipCanal(canal: string, lang: Idioma, activo: boolean): string {
  const icono = canal === "whatsapp" ? "phone" : canal === "email" ? "mail" : canal === "webchat" ? "chat" : "message-square";
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  return `<div class="${cls}" onclick="toggleFilter('channel','${canal}')">
    ${lucide(icono, { size: 16 })}
    <span class="chip-name text-sm">${canalNombre(canal, lang)}</span>
  </div>`;
}

/** Estado por omisión en colores OMEGA: open=verde, pending=ambar, snoozed=gris, resolved=azul. */
const COLOR_ESTADO: Readonly<Record<string, string>> = {
  open: "sev-success",
  pending: "sev-medium",
  snoozed: "sev-low",
  resolved: "sev-process",
};

const ESTADOS: readonly string[] = ["open", "pending", "snoozed", "resolved"];

function chipEstado(estado: string, lang: Idioma, activo: boolean): string {
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  const color = COLOR_ESTADO[estado] ?? "sev-low";
  return `<div class="${cls}" onclick="toggleFilter('status','${estado}')">
    <span class="chip-name text-sm ${color}">${t(lang, `filtro.estado.${estado}`)}</span>
  </div>`;
}

function chipSLA(lang: Idioma, activo: boolean): string {
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  const etiqueta = activo ? t(lang, "filtro.sla.violated") : t(lang, "filtro.sla");
  return `<div class="${cls}" onclick="toggleFilter('sla','violated')">
    ${lucide("warning-triangle", { size: 16 })}
    <span class="chip-name text-sm sev-critical">${etiqueta}</span>
  </div>`;
}

function chipClean(lang: Idioma): string {
  return `<div class="chip flex items-center gap-sm" onclick="toggleFilterClean()">
    ${lucide("cross", { size: 16 })}
    <span class="chip-name text-sm text-muted">${t(lang, "filtro.clean")}</span>
  </div>`;
}

function kpis(estadisticas: DashboardStats, ctx: AppContext, lang: Idioma): string {
  const activas = t(lang, "dash.activas");
  const noAsig = t(lang, "dash.sinAsignar");
  const plan = t(lang, "dash.plan");
  const estado = estadisticas.abiertas;
  return `<div class="kpis">
    <div class="kpi"><div class="kpi-label">${t(lang, "kpi.tenant")}</div><div class="kpi-value" style="font-size:18px"><small>${ctx.tenantName}</small></div></div>
    <div class="kpi"><div class="kpi-label">${activas}</div><div class="kpi-value" style="color:var(--hub)">${estado}</div></div>
    <div class="kpi"><div class="kpi-label">${noAsig}</div><div class="kpi-value">${estadisticas.sinAsignar}</div></div>
    <div class="kpi"><div class="kpi-label">${plan}</div><div class="kpi-value" style="font-size:18px"><small>${ctx.tenantPlan}</small></div></div>
  </div>`;
}

function panelVacio(ctx: AppContext, lang: Idioma): string {
  const titulo = t(lang, "dash.emptyTitle");
  const cuerpo = t(lang, "dash.emptyBody");
  const accion = t(lang, "dash.emptyAction");
  return `<div class="card" style="margin-top:14px;padding:22px;text-align:center">
    <div class="glyph" style="justify-content:center;color:var(--primary)">${lucide("channels", { size: 30 })}</div>
    <h4 style="margin:10px 0 4px">${titulo}</h4>
    <p class="text-sm text-muted" style="margin:0 0 14px">${cuerpo}</p>
    <button class="badge badge-hub tap" onclick="handleAction('navigate',{tab:'channels'})">${accion}</button>
  </div>`;
}

/** Renderiza conversaciones en 3 columnas (lista + hilo + ficha 360). */
function cuerpoLista(items: readonly InboxItem[], ctx: AppContext, lang: Idioma): string {
  const lista = items.length
    ? renderInboxList(items, [], lang)
    : `<p class="text-sm text-muted p-md">${t(lang, "inbox.empty")}</p>`;
  return `<div class="grid dash-grid gap" style="margin-top:14px">
    <div class="card" style="padding:0;overflow:hidden">
      <div class="section text-sm font-bold text-muted px-sm">${t(lang, "dash.conversaciones")}</div>
      <div class="list">${lista}</div>
    </div>
    <div class="card" style="padding:0" data-chat-thread data-empty360>
      <div class="section text-sm font-bold text-muted px-sm">${t(lang, "dash.conversaciones")}</div>
      <div class="p-md">
        <p class="text-sm text-muted">${t(lang, "chat.empty")}</p>
      </div>
    </div>
    <div class="card" style="padding:0" data-contact360 data-empty360>
      <div class="section text-sm font-bold text-muted px-sm">${t(lang, "dash.ficha")}</div>
      <div class="p-md">
        <p class="text-sm text-muted">${t(lang, "dash.fichaEmpty")}</p>
      </div>
    </div>
  </div>`;
}

export function renderDashboard(
  items: readonly InboxItem[],
  ctx: AppContext,
  lang: Idioma,
  filtroCanal: string | null = null,
  filtroEstado: string | null = null,
  filtroSLA: boolean | null = null,
): string {
  const estadisticas = calcularStats(items);
  const canalesActivos = CANALES.filter((c) => estadisticas.porCanal[c] !== undefined);
  const chips = (canalesActivos.length ? canalesActivos : ["whatsapp", "email", "instagram"])
    .map((c) => chipCanal(c, lang, c === filtroCanal)).join("");

  const chipsEstado = ESTADOS
    .map((e) => chipEstado(e, lang, e === filtroEstado)).join("");
  const chipsSLA = chipSLA(lang, filtroSLA === true);

  const seccion = items.length === 0
    ? panelVacio(ctx, lang)
    : cuerpoLista(items, ctx, lang);

  return `<div class="view">
    ${kpis(estadisticas, ctx, lang)}
    <div class="section text-sm font-bold text-muted">${t(lang, "inbox.channels")} <span class="more text-xs text-hub">${t(lang, "inbox.seeAll")}</span></div>
    <div class="chips">${chips}</div>
    <div class="section text-sm font-bold text-muted">${t(lang, "inbox.filtros")}</div>
    <div class="chips">${chipsEstado}${chipsSLA}${chipClean(lang)}</div>
    <div class="section text-sm font-bold text-muted">${t(lang, "dash.conversaciones")}</div>
    ${seccion}
  </div>`;
}