/**
 * HUB by Raisen — Panel dashboard principal (vista Inbox).
 * Stats, chips y paneles en submódulos; render orquestador (C4 ≤75).
 */
import type { InboxItem, AppContext } from "./types.ts";
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import { CANALES, calcularStats, ESTADOS, COLOR_ESTADO } from "./dashboard-stats.ts";
import { chipCanal, chipEstado, chipSLA, chipClean } from "./dashboard-chips.ts";
import { kpis, panelVacio, cuerpoLista } from "./dashboard-panels.ts";

export type { DashboardStats } from "./dashboard-stats.ts";
export { calcularStats } from "./dashboard-stats.ts";

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

export { COLOR_ESTADO, ESTADOS, CANALES };