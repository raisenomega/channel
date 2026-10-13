/**
 * HUB by Raisen — Vista de canales (FASE 9.5-9.7).
 * Compone chips (conectar/desconectar), autonomia por canal y proveedor IA
 * (BYOK) a partir del estado local persistido en channel-store.
 */
import { t, type Idioma } from "./i18n.ts";
import { estadoActual } from "./channel-handlers.ts";
import { renderAutonomia, renderChips, renderProveedor } from "./channel-ui.ts";
import { renderIntegraciones } from "./integrations-view.ts";

export function renderChannelSettings(lang: Idioma): string {
  const estado = estadoActual();
  const conectados = estado.canales.filter((c) => c.active).length;
  return `<div class="view">
    <div class="section text-sm font-bold text-muted">${t(lang, "channels.connected")}
      <span class="more text-xs text-hub">${conectados} ${t(lang, "channels.count")}</span>
    </div>
    ${renderChips(estado.canales, lang)}
    ${renderAutonomia(estado.canales, lang)}
    ${renderProveedor(estado.proveedor, lang)}
    ${renderIntegraciones(lang)}
  </div>`;
}