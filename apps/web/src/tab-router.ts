/**
 * HUB by Raisen — Dispatcher de pestanas (C4 extract de app.ts).
 */
import { t, type Idioma } from "./i18n.ts";
import { getIdioma } from "./interfaz.ts";
import type { AppContext, TabId, InboxItem } from "./types.ts";
import { renderDashboard } from "./dashboard-widget.ts";
import { renderAgentDashboard } from "./agent-dashboard.ts";
import { renderChannelSettings } from "./channel-settings.ts";
import { renderAccountPrefs } from "./settings-account.ts";
import { renderCompliance } from "./compliance-view.ts";

export function renderTab(tab: TabId, ctx: AppContext, inbox: readonly InboxItem[], filtroCanal: string | null): string {
  const lang: Idioma = getIdioma();
  switch (tab) {
    case "inbox": {
      const filtrados = filtroCanal
        ? inbox.filter((i) => i.channel === filtroCanal)
        : inbox;
      return renderDashboard(filtrados, ctx, lang, filtroCanal);
    }
    case "agent":
      return renderAgentDashboard(94, 92, 87, "1.45s", "Anthropic Claude", "claude-sonnet-4-6", true, "DeepSeek", "ecosystem", lang);
    case "channels":
      return renderChannelSettings(lang);
    case "settings":
      return `<div class="view">
        ${renderAccountPrefs(ctx, lang)}
        ${renderCompliance(lang, null, null)}
      </div>`;
    default:
      return `<div class="view"><p class="text-sm text-muted">${t(lang, "common.selectTab")}</p></div>`;
  }
}