import type { PageState, TabId, InboxItem, AppContext } from "./types.ts";
import { createInitialState, cycleMode, navigate, popSubPage } from "./navigation.ts";
import { renderAgentDashboard } from "./agent-dashboard.ts";
import { renderChannelSettings } from "./channel-settings.ts";
import { renderDashboard } from "./dashboard-widget.ts";
import { t, type Idioma } from "./i18n.ts";
import { getTema, getIdioma } from "./interfaz.ts";

export type CargarInbox = () => Promise<InboxItem[]>;

export class HUBApp {
  private state: PageState = createInitialState();
  private inbox: InboxItem[] = [];
  private filtroCanal: string | null = null;

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

  currentTab(): TabId {
    return this.state.currentTab;
  }

  contactIdDeConversacion(conversationId: string): string | null {
    const c = this.inbox.find((i) => i.conversationId === conversationId);
    return c?.contactId ?? null;
  }

  toggleFiltroCanal(canal: string): void {
    this.filtroCanal = this.filtroCanal === canal ? null : canal;
  }

  filtroActual(): string | null {
    return this.filtroCanal;
  }

  renderCurrentTab(): string {
    const lang: Idioma = getIdioma();
    switch (this.state.currentTab) {
      case "inbox": {
        const filtrados = this.filtroCanal
          ? this.inbox.filter((i) => i.channel === this.filtroCanal)
          : this.inbox;
        return renderDashboard(filtrados, this.context, lang, this.filtroCanal);
      }

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