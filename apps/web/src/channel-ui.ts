/**
 * HUB by Raisen — Canal: render de fragmentos de la vista (FASE 9.5-9.7).
 * Chips (conectar/desconectar), autonomia por canal y proveedor IA (BYOK).
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";
import { CANALES, CanalState, ProveedorState, PROVEEDORES, SyncMark } from "./channel-model.ts";

export function renderChips(canales: readonly CanalState[], lang: Idioma): string {
  return `<div class="chips" style="margin-bottom:8px">
    ${canales.map((c) => {
      const icon = CANALES.find((n) => n.key === c.key)?.icon ?? "chat";
      return `<div class="chip ${c.active ? "active" : ""} flex items-center gap-sm cursor-pointer"
          onclick="actuarCanal('toggleCanal',{id:'${c.key}'})">
        ${lucide(icon, { size: 16 })}
        <span class="chip-name text-sm">${t(lang, `canal.${c.key}`)}</span>
        <span class="chip-status flex items-center gap-xs text-xs text-muted" style="margin-top:0">
          <span class="dot ${c.active ? "dot-on" : "dot-off"}"></span>
          ${c.active ? t(lang, "channels.active") : t(lang, "channels.inactive")}
        </span>
      </div>`;
    }).join("")}
  </div>`;
}

export function renderAutonomia(canales: readonly CanalState[], lang: Idioma): string {
  return `<div class="section text-sm font-bold text-muted">${t(lang, "channels.autonomy")}</div>
    <div class="card" style="padding:12px">
      ${canales.map((c) => `
        <div class="feat flex items-center gap-sm">
          <span class="text-sm">${t(lang, `canal.${c.key}`)}</span>
          <div class="switch ${c.autonomous ? "on" : "off"} ml-auto"
            onclick="actuarCanal('toggleAutonomia',{id:'${c.key}'})"><i></i></div>
        </div>`).join("")}
    </div>
    <div class="text-xs text-dim" style="margin-top:6px">${t(lang, "channels.autonomyHint")}</div>`;
}

export function renderProveedor(p: ProveedorState, lang: Idioma): string {
  const pendiente = p.sync === "pending";
  return `<div class="section text-sm font-bold text-muted">${t(lang, "channels.configureAI")}</div>
    <div class="card" style="padding:14px">
      <div class="feat flex items-center gap-sm">
        <span class="text-sm font-bold">${t(lang, "channels.provider")}</span>
        <select data-ai-select class="ml-auto" aria-label="${t(lang, "channels.provider")}" ${pendiente ? "disabled" : ""}>
          ${PROVEEDORES.map(({ key }) =>
            `<option value="${key}" ${p.provider === key ? "selected" : ""}>${key}</option>`).join("")}
        </select>
      </div>
      <div class="feat flex flex-col gap-sm" style="margin-top:8px">
        <label class="text-sm font-bold">${t(lang, "channels.apiKey")}</label>
        <input data-ai-key type="password" style="width:100%" placeholder="${t(lang, "channels.apiKeyPh")}" aria-label="${t(lang, "channels.apiKey")}" ${pendiente ? "disabled" : ""}>
      </div>
      <div class="feat flex items-center gap-sm" style="margin-top:8px">
        <button class="badge badge-hub cursor-pointer ${pendiente ? "loading" : ""}" onclick="actuarCanal('guardarProveedor')" ${pendiente ? "disabled" : ""}>${t(lang, "channels.save")}</button>
        <span class="text-xs text-dim ml-auto">${marca(p.sync, lang)}</span>
      </div>
    </div>`;
}

function marca(sync: SyncMark, lang: Idioma): string {
  if (sync === "cloud") return t(lang, "channels.savedCloud");
  if (sync === "error") return t(lang, "channels.saveError");
  if (sync === "local") return t(lang, "channels.savedLocal");
  return "";
}