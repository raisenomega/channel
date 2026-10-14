/**
 * HUB by Raisen — Panel CRM 360 del contacto (vista inbox).
 * Helpers y bloque comercial en contact-360-render.ts (C4 ≤75).
 */
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { Contact360 } from "./contact-client.ts";
import { inicial, fila, renderComercial, moneda } from "./contact-360-render.ts";

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