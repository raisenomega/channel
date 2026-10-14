/**
 * HUB by Raisen — Chips de filtro del dashboard.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import { COLOR_ESTADO } from "./dashboard-stats.ts";

function canalNombre(canal: string, lang: Idioma): string {
  const clave = `canal.${canal}`;
  const traducido = t(lang, clave);
  return traducido === clave ? canal : traducido;
}

export function chipCanal(canal: string, lang: Idioma, activo: boolean): string {
  const icono = canal === "whatsapp" ? "phone" : canal === "email" ? "mail" : canal === "webchat" ? "chat" : "message-square";
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  return `<div class="${cls}" onclick="toggleFilter('channel','${canal}')">
    ${lucide(icono, { size: 16 })}
    <span class="chip-name text-sm">${canalNombre(canal, lang)}</span>
  </div>`;
}

export function chipEstado(estado: string, lang: Idioma, activo: boolean): string {
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  const color = COLOR_ESTADO[estado] ?? "sev-low";
  return `<div class="${cls}" onclick="toggleFilter('status','${estado}')">
    <span class="chip-name text-sm ${color}">${t(lang, `filtro.estado.${estado}`)}</span>
  </div>`;
}

export function chipSLA(lang: Idioma, activo: boolean): string {
  const cls = activo ? "chip flex items-center gap-sm active" : "chip flex items-center gap-sm";
  const etiqueta = activo ? t(lang, "filtro.sla.violated") : t(lang, "filtro.sla");
  return `<div class="${cls}" onclick="toggleFilter('sla','violated')">
    ${lucide("warning-triangle", { size: 16 })}
    <span class="chip-name text-sm sev-critical">${etiqueta}</span>
  </div>`;
}

export function chipClean(lang: Idioma): string {
  return `<div class="chip flex items-center gap-sm" onclick="toggleFilterClean()">
    ${lucide("cross", { size: 16 })}
    <span class="chip-name text-sm text-muted">${t(lang, "filtro.clean")}</span>
  </div>`;
}