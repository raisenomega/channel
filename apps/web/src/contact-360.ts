/**
 * HUB by Raisen — Panel CRM 360 del contacto (vista inbox).
 * Renderiza datos reales del contacto + historial comercial (PRD CRM: HP4).
 */
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { Contact360 } from "./contact-client.ts";

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

function fila(label: string, valor: string, legible: boolean): string {
  return `<div class="feat flex items-center gap-sm" style="padding:7px 0;border-bottom:1px solid hsl(var(--border) / 0.25)">
    <span class="text-sm text-muted">${label}</span>
    <span class="text-sm text-hub ml-auto ${legible ? "" : "text-dim"}">${valor}</span>
  </div>`;
}

function seccionTitulo(titulo: string): string {
  return `<div class="text-xs font-bold text-muted" style="letter-spacing:0.06em;text-transform:uppercase;margin:14px 0 4px">${titulo}</div>`;
}

function fecha(d: Date, lang: Idioma): string {
  return d.toLocaleDateString(lang === "es" ? "es" : "en");
}

function moneda(v: number, mon: string, lang: Idioma): string {
  return v.toLocaleString(lang === "es" ? "es" : "en", { style: "currency", currency: mon || "USD" });
}

function listaVacia(lang: Idioma): string {
  return `<p class="text-sm text-muted" style="margin:2px 0 6px">${t(lang, "dash.sinRegistros")}</p>`;
}

function renderComercial(c: Contact360, lang: Idioma): string {
  const cotiz = c.cotizaciones.length === 0
    ? listaVacia(lang)
    : c.cotizaciones.slice(0, 3).map((q) =>
        fila(`${t(lang, "dash.estado." + q.status)} · ${fecha(q.createdAt, lang)}`, moneda(q.totalAmount, q.currency, lang), true),
      ).join("");
  const orden = c.ordenes.length === 0
    ? listaVacia(lang)
    : c.ordenes.slice(0, 3).map((o) =>
        fila(`${t(lang, "dash.estado." + o.status)} · ${fecha(o.createdAt, lang)}`, moneda(o.totalAmount, o.currency, lang), true),
      ).join("");
  const pago = c.pagos.length === 0
    ? listaVacia(lang)
    : c.pagos.slice(0, 3).map((p) =>
        fila(`${t(lang, "dash.estado." + p.status)}`, moneda(p.amount, p.currency, lang), true),
      ).join("");

  return `${seccionTitulo(t(lang, "dash.seccCotizaciones"))}${cotiz}
    ${seccionTitulo(t(lang, "dash.seccOrdenes"))}${orden}
    ${seccionTitulo(t(lang, "dash.seccPagos"))}${pago}`;
}

export function renderContact360(c: Contact360, lang: Idioma): string {
  const segmento = c.segment ? t(lang, `dash.segmento.${c.segment}`) : "—";
  const ltv = moneda(c.ltvUsd, "USD", lang);
  const canal = c.preferredChannel ? t(lang, `canal.${c.preferredChannel}`) : "—";
  const dni = c.doNotContact ? t(lang, "dash.dnc") : t(lang, "dash.ok");
  return `<div>
    <div class="flex items-center gap" style="padding:14px">
      <div class="avatar" style="background:var(--hub-deep)">${inicial(c.displayName)}</div>
      <div class="flex-1 min-width-0">
        <div class="text-base font-bold truncate">${c.displayName}</div>
        <div class="text-xs text-muted">${c.primaryEmail ?? c.primaryPhone ?? "—"}</div>
      </div>
    </div>
    <div class="px-sm">
      ${fila(t(lang, "dash.telefono"), c.primaryPhone ?? "—", c.primaryPhone !== null)}
      ${fila(t(lang, "dash.email"), c.primaryEmail ?? "—", c.primaryEmail !== null)}
      ${fila(t(lang, "dash.segmento"), segmento, c.segment !== null)}
      ${fila(t(lang, "dash.pedidos"), String(c.totalOrders), true)}
      ${fila(t(lang, "dash.ltv"), ltv, true)}
      ${fila(t(lang, "dash.prefCanal"), canal, c.preferredChannel !== null)}
      ${fila(t(lang, "dash.consent"), dni, !c.doNotContact)}
    </div>
    ${renderComercial(c, lang)}
  </div>`;
}

export function renderCargando360(lang: Idioma): string {
  return `<div class="p-md text-sm text-muted">${t(lang, "dash.fichaCargando")}</div>`;
}