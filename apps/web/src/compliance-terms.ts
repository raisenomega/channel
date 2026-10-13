/**
 * HUB by Raisen — Terminos del servicio (parte de compliance-view).
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";

export function renderTermsOfService(lang: Idioma): string {
  return `<a href="/terms" target="_blank" rel="noopener noreferrer" class="block card" style="padding:14px;color:var(--foreground);text-decoration:none">
    <div class="feat flex items-center gap-sm">
      <span class="glyph" style="color:var(--primary)">${lucide("check", { size: 18 })}</span>
      <span class="text-sm font-bold">${t(lang, "legal.termsLink")}</span>
      <span class="ml-auto text-xs text-dim">${lucide("chevron-right", { size: 16 })}</span>
    </div>
  </a>`;
}