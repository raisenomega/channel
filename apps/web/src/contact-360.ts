/**
 * HUB by Raisen — Panel CRM 360 del contacto (vista inbox).
 * Renderiza datos reales del contacto en el panel lateral sin salir de pantalla (HP4).
 */
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { Contact360 } from "./contact-client.ts";

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

function fila(label: string, valor: string, legible: boolean): string {
  return `<div class="feat flex items-center gap-sm" style="padding:8px 0;border-bottom:1px solid hsl(var(--border) / 0.3)">
    <span class="text-sm text-muted">${label}</span>
    <span class="text-sm text-hub ml-auto ${legible ? "" : "text-dim"}">${valor}</span>
  </div>`;
}

export function renderContact360(c: Contact360, lang: Idioma): string {
  const segmento = c.segment ? t(lang, `dash.segmento.${c.segment}`) : "—";
  const ltv = c.ltvUsd.toLocaleString(lang === "es" ? "es" : "en", { style: "currency", currency: "USD" });
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
    ${c.totalOrders === 0 && !c.primaryEmail && !c.primaryPhone
      ? `<p class="text-sm text-muted p-sm">${t(lang, "dash.fichaSinDatos")}</p>`
      : ""}
  </div>`;
}

export function renderCargando360(lang: Idioma): string {
  return `<div class="p-md text-sm text-muted">${t(lang, "dash.fichaCargando")}</div>`;
}