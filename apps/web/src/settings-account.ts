/**
 * HUB by Raisen — Preferencias de cuenta (sub-vista de settings).
 */
import { t, type Idioma } from "./i18n.ts";
import { getTema } from "./interfaz.ts";
import type { AppContext } from "./types.ts";

export function renderAccountPrefs(ctx: AppContext, lang: Idioma): string {
  return `<div class="section text-sm font-bold text-muted">${t(lang, "settings.account")}</div>
<div class="card" style="padding:14px">
  <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">${t(lang, "settings.email")}</span><span class="text-hub ml-auto">${ctx.email}</span></div>
  <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.tenant")}</span><span class="text-hub ml-auto">${ctx.tenantName}</span></div>
  <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.plan")}</span><span class="text-hub" style="color:var(--hub-deep)">${ctx.tenantPlan}</span></div>
</div>
<div class="section text-sm font-bold text-muted">${t(lang, "settings.preferences")}</div>
<div class="card" style="padding:14px">
  <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">${t(lang, "settings.language")}</span><span class="text-hub ml-auto">${t(lang, "settings.languageValue")}</span></div>
  <div class="feat flex items-center gap-sm" style="margin-top:8px">
    <span class="text-sm font-bold">${t(lang, "settings.theme")}</span>
    <button class="switch ${getTema() === 'dark' ? 'on' : 'off'} ml-auto" data-settings-theme aria-label="${t(lang, "settings.theme")}"><i></i></button>
  </div>
  <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.whiteLabel")}</span><div class="switch off ml-auto"><i></i></div></div>
</div>`;
}