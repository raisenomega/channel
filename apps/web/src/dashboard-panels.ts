/**
 * HUB by Raisen — Paneles (KPIs, vacío, lista de conversaciones) del dashboard.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { InboxItem, AppContext } from "./types.ts";
import { renderInboxList } from "./inbox-widget.ts";
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { DashboardStats } from "./dashboard-stats.ts";

export function kpis(estadisticas: DashboardStats, ctx: AppContext, lang: Idioma): string {
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

export function panelVacio(ctx: AppContext, lang: Idioma): string {
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
export function cuerpoLista(items: readonly InboxItem[], ctx: AppContext, lang: Idioma): string {
  const lista = items.length
    ? renderInboxList(items, [], lang)
    : panelVacio(ctx, lang);
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