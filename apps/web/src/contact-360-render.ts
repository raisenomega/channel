/**
 * HUB by Raisen — Helpers de render y bloque comercial de la ficha 360.
 */
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { Contact360 } from "./contact-client.ts";

export function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

export function fila(label: string, valor: string, legible: boolean): string {
  return `<div class="feat flex items-center gap-sm" style="padding:7px 0;border-bottom:1px solid hsl(var(--border) / 0.25)">
    <span class="text-sm text-muted">${label}</span>
    <span class="text-sm text-hub ml-auto ${legible ? "" : "text-dim"}">${valor}</span>
  </div>`;
}

export function seccionTitulo(titulo: string): string {
  return `<div class="text-xs font-bold text-muted" style="letter-spacing:0.06em;text-transform:uppercase;margin:14px 0 4px">${titulo}</div>`;
}

export function fecha(d: Date, lang: Idioma): string {
  return d.toLocaleDateString(lang === "es" ? "es" : "en");
}

export function moneda(v: number, mon: string, lang: Idioma): string {
  return v.toLocaleString(lang === "es" ? "es" : "en", { style: "currency", currency: mon || "USD" });
}

export function listaVacia(lang: Idioma): string {
  return `<p class="text-sm text-muted" style="margin:2px 0 6px">${t(lang, "dash.sinRegistros")}</p>`;
}

export function renderComercial(c: Contact360, lang: Idioma): string {
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