/**
 * HUB by Raisen — Vista de Legal / Compliance (FASE 10 lite).
 * Renderiza secciones honestas segun config del tenant:
 * - Aviso de privacidad (desde privacy_config si existe)
 * - Divulgacion de IA (SB-1001) visible siempre
 * - Terminos del servicio
 * Guardado de opt-in requiere RPC backend (P1 honesto).
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";
import { renderTermsOfService } from "./compliance-terms.ts";
import { renderOptInChannels, type ChannelOptIn } from "./compliance-optin.ts";

export type { ChannelOptIn };

export interface PrivacyConfig {
  readonly url?: string;
  readonly updatedAt?: string;
}

function renderPrivacyNotice(lang: Idioma, config?: PrivacyConfig | null): string {
  if (!config?.url) {
    return `<div class="card" style="padding:14px">
      <div class="feat flex items-center gap-sm">
        <span class="glyph" style="color:var(--text-dim)">${lucide("info-circle", { size: 18 })}</span>
        <span class="text-sm text-muted">${t(lang, "legal.privacyPending")}</span>
      </div>
    </div>`;
  }
  const updated = config.updatedAt
    ? `<span class="text-xs text-dim">${t(lang, "legal.updatedAt")} ${config.updatedAt}</span>`
    : "";
  return `<div class="card" style="padding:14px">
    <div class="feat flex items-center gap-sm">
      <span class="glyph" style="color:var(--primary)">${lucide("info-circle", { size: 18 })}</span>
      <a href="${config.url}" target="_blank" rel="noopener noreferrer" class="text-sm font-bold">${t(lang, "legal.privacyLink")}</a>
      ${updated}
    </div>
  </div>`;
}

function renderAiDisclosure(lang: Idioma, optIn?: ChannelOptIn | null): string {
  return `<div class="card" style="padding:14px">
    <div class="feat flex items-center gap-sm">
      <span class="glyph" style="color:var(--agent)">${lucide("agent", { size: 18 })}</span>
      <span class="text-sm">${t(lang, "legal.aiDisclosureDesc")}</span>
    </div>
    <div class="section text-sm font-bold text-muted" style="margin-top:14px">${t(lang, "legal.aiOptIn")}</div>
    ${renderOptInChannels(lang, optIn)}
  </div>`;
}

export function renderCompliance(lang: Idioma, privacyConfig?: PrivacyConfig | null, optIn?: ChannelOptIn | null): string {
  return `<div class="view">
    <div class="section text-sm font-bold text-muted">${t(lang, "legal.privacyNotice")}</div>
    <p class="text-sm text-dim" style="margin:4px 0 10px">${t(lang, "legal.privacyDesc")}</p>
    ${renderPrivacyNotice(lang, privacyConfig)}
    <div class="section text-sm font-bold text-muted">${t(lang, "legal.aiDisclosure")}</div>
    ${renderAiDisclosure(lang, optIn)}
    <div class="section text-sm font-bold text-muted">${t(lang, "legal.termsOfService")}</div>
    ${renderTermsOfService(lang)}
  </div>`;
}