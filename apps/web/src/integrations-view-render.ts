/**
 * HUB by Raisen — Render de la vista de integraciones.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";
import type { IntegrationConfig, IntegrationType } from "./integrations-client.ts";
import { estado } from "./integrations-view-state.ts";

const ICONOS: readonly { type: IntegrationType; icon: string }[] = Object.freeze([
  { type: "nucleo", icon: "channels" },
  { type: "omega", icon: "agent" },
  { type: "pos", icon: "chat" },
  { type: "table", icon: "star" },
  { type: "health", icon: "bell" },
  { type: "home", icon: "inbox" },
  { type: "fleet", icon: "send" },
]);

/** Render de la seccion de integraciones dentro de la pestana Canales. */
export function renderIntegraciones(lang: Idioma): string {
  const conectadas = estado.configs.filter((c) => c.isActive).length;
  return `<div class="section text-sm font-bold text-muted">${t(lang, "integrations.title")}
      <span class="more text-xs text-hub">${conectadas} ${t(lang, "integrations.count")}</span>
    </div>
    <div class="card" style="padding:6px 12px">
      ${lista(estado.configs, lang)}
    </div>
    ${
      estado.sync === "pending"
        ? `<div class="text-xs text-dim" style="margin-top:4px">${t(lang, "integrations.pending")}</div>`
        : estado.sync === "error"
          ? `<div class="text-xs text-dim" style="margin-top:4px">${t(lang, "integrations.syncError")}</div>`
          : ""
    }`;
}

function lista(configs: readonly IntegrationConfig[], lang: Idioma): string {
  if (configs.length === 0) {
    return `<div class="p-md text-sm text-muted" style="text-align:center;padding:18px 8px">
        ${lucide("channels", { size: 20 })}
        <div style="margin-top:8px">${t(lang, "integrations.empty")}</div>
      </div>`;
  }
  return configs
    .map((c) => {
      const icon = ICONOS.find((i) => i.type === c.type)?.icon ?? "channels";
      return `<div class="feat flex items-center gap-sm">
          ${lucide(icon, { size: 16 })}
          <span class="text-sm">${t(lang, `integrations.${c.type}`)}</span>
          <span class="chip-status flex items-center gap-xs text-xs text-muted ml-auto" style="margin-top:0">
            <span class="dot ${c.isActive ? "dot-on" : "dot-off"}"></span>
            ${c.isActive ? t(lang, "channels.active") : t(lang, "channels.inactive")}
          </span>
          <div class="switch ${c.isActive ? "on" : "off"}"
            onclick="actuarIntegracion('toggleIntegracion',{id:'${c.type}'})"><i></i></div>
        </div>`;
    })
    .join("");
}