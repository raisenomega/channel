/**
 * HUB by Raisen — Opt-in IA por canal (parte de compliance-view).
 */
import { t, type Idioma } from "./i18n.ts";

export interface ChannelOptIn {
  readonly whatsapp: boolean;
  readonly email: boolean;
  readonly webchat: boolean;
}

export function renderOptInChannels(lang: Idioma, optIn?: ChannelOptIn | null): string {
  if (!optIn) {
    return `<p class="text-sm text-muted p-sm">${t(lang, "legal.aiOptInPending")}</p>`;
  }
  const entries: [string, boolean, string][] = [
    [optIn.whatsapp ? "dot-on" : "dot-off", optIn.whatsapp, t(lang, "legal.aiOptInWhatsapp")],
    [optIn.email ? "dot-on" : "dot-off", optIn.email, t(lang, "legal.aiOptInEmail")],
    [optIn.webchat ? "dot-on" : "dot-off", optIn.webchat, t(lang, "legal.aiOptInWebchat")],
  ];
  return `<div class="flex flex-col gap-xs">
    ${entries.map(([dotCls, active, name]) => `<div class="feat flex items-center gap-sm">
      <span class="dot ${dotCls}"></span>
      <span class="text-sm font-medium">${name}</span>
      <span class="ml-auto text-xs ${active ? "text-ok" : "text-dim"}">${active ? "OK" : "—"}</span>
    </div>`).join("")}
  </div>`;
}