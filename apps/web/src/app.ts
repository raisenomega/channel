import type { PageState, TabId, InboxItem, AppContext } from "./types.ts";
import { createInitialState, cycleMode, navigate, popSubPage } from "./navigation.ts";
import { renderInboxList, renderFilterChips } from "./inbox-widget.ts";
import { renderAgentDashboard } from "./agent-dashboard.ts";
import { renderChannelSettings } from "./channel-settings.ts";
import { t, type Idioma } from "./i18n.ts";
import { getTema, getIdioma } from "./interfaz.ts";

export type CargarInbox = () => Promise<InboxItem[]>;

export class HUBApp {
  private state: PageState = createInitialState();
  private inbox: InboxItem[] = [];

  constructor(
    private readonly context: AppContext,
    private readonly cargarInbox: CargarInbox,
  ) {}

  async iniciar(): Promise<void> {
    try {
      this.inbox = await this.cargarInbox();
    } catch {
      this.inbox = [];
    }
  }

  renderCurrentTab(): string {
    const lang: Idioma = getIdioma();
    const nav = this.context.tenantName;
    switch (this.state.currentTab) {
      case "inbox":
        return `<div class="view">
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">${t(lang, "kpi.tenant")}</div><div class="kpi-value"><small>${nav}</small></div></div>
            <div class="kpi"><div class="kpi-label">${t(lang, "kpi.wasCorrect")}</div><div class="kpi-value" style="color:var(--good)">94<small>%</small></div></div>
            <div class="kpi"><div class="kpi-label">${t(lang, "kpi.salesChat")}</div><div class="kpi-value" style="color:var(--hub)">$0<small>hoy</small></div></div>
            <div class="kpi"><div class="kpi-label">${t(lang, "kpi.autonomy")}</div><div class="kpi-value">87<small>%</small></div></div>
          </div>
          <div class="section text-sm font-bold text-muted">${t(lang, "inbox.channels")} <span class="more text-xs text-hub">${t(lang, "inbox.seeAll")}</span></div>
          ${renderFilterChips([], ["whatsapp", "email", "instagram"])}
          <div class="section text-sm font-bold text-muted">${t(lang, "inbox.active")} <span class="more text-xs text-hub">${this.inbox.length} ${t(lang, "inbox.total")}</span></div>
          <div class="list">${this.inbox.length ? renderInboxList(this.inbox, [], lang) : `<p class="text-sm text-muted p-md">${t(lang, "inbox.empty")}</p>`}</div>
        </div>`;

      case "agent":
        return renderAgentDashboard(94, 92, 87, "1.45s", "Anthropic Claude", "claude-sonnet-4-6", true, "DeepSeek", this.state.mode, lang);

      case "channels":
        return renderChannelSettings([], lang);

      case "settings":
        return `<div class="view">
          <div class="section text-sm font-bold text-muted">${t(lang, "settings.account")}</div>
          <div class="card" style="padding:14px">
            <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">${t(lang, "settings.email")}</span><span class="text-hub ml-auto">${this.context.email}</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.tenant")}</span><span class="text-hub ml-auto">${this.context.tenantName}</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.plan")}</span><span class="text-hub" style="color:var(--hub-deep)">${this.context.tenantPlan}</span></div>
          </div>
          <div class="section text-sm font-bold text-muted">${t(lang, "settings.preferences")}</div>
          <div class="card" style="padding:14px">
            <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">${t(lang, "settings.language")}</span><span class="text-hub ml-auto">${t(lang, "settings.languageValue")}</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px">
              <span class="text-sm font-bold">${t(lang, "settings.theme")}</span>
              <button class="switch ${getTema() === 'dark' ? 'on' : 'off'} ml-auto" data-settings-theme aria-label="${t(lang, "settings.theme")}"><i></i></button>
            </div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">${t(lang, "settings.whiteLabel")}</span><div class="switch off ml-auto"><i></i></div></div>
          </div>
        </div>`;

      default:
        return `<div class="view"><p class="text-sm text-muted">${t(lang, "common.selectTab")}</p></div>`;
    }
  }

  handleAction(action: string, params?: Record<string, unknown>): void {
    switch (action) {
      case "cycleMode": this.state = cycleMode(this.state); break;
      case "navigate": this.state = navigate(this.state, params?.tab as TabId ?? "inbox"); break;
      case "back": this.state = popSubPage(this.state); break;
    }
  }
}