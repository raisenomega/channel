import type { PageState, TabId, InboxItem, AppContext } from "./types.ts";
import { createInitialState, cycleMode, toggleTheme, navigate, popSubPage } from "./navigation.ts";
import { renderInboxList, renderFilterChips } from "./inbox-widget.ts";
import { renderAgentDashboard } from "./agent-dashboard.ts";
import { renderChannelSettings } from "./channel-settings.ts";

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
    const nav = this.context.tenantName;
    switch (this.state.currentTab) {
      case "inbox":
        return `<div class="view">
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Tenant</div><div class="kpi-value"><small>${nav}</small></div></div>
            <div class="kpi"><div class="kpi-label">IA Was Correct</div><div class="kpi-value" style="color:var(--good)">94<small>%</small></div></div>
            <div class="kpi"><div class="kpi-label">Ventas desde chat</div><div class="kpi-value" style="color:var(--hub)">$0<small>hoy</small></div></div>
            <div class="kpi"><div class="kpi-label">Autonomia</div><div class="kpi-value">87<small>%</small></div></div>
          </div>
          <div class="section text-sm font-bold text-muted">Canales <span class="more text-xs text-hub">Ver todos</span></div>
          ${renderFilterChips([], ["whatsapp", "email", "instagram"])}
          <div class="section text-sm font-bold text-muted">Conversaciones activas <span class="more text-xs text-hub">${this.inbox.length} total</span></div>
          <div class="list">${this.inbox.length ? renderInboxList(this.inbox, []) : `<p class="text-sm text-muted p-md">Aun no hay conversaciones para este tenant.</p>`}</div>
        </div>`;

      case "agent":
        return renderAgentDashboard(94, 92, 87, "1.45s", "Anthropic Claude", "claude-sonnet-4-6", true, "DeepSeek", this.state.mode);

      case "channels":
        return renderChannelSettings([]);

      case "settings":
        return `<div class="view">
          <div class="section text-sm font-bold text-muted">Tu cuenta</div>
          <div class="card" style="padding:14px">
            <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">Email</span><span class="text-hub ml-auto">${this.context.email}</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">Tenant</span><span class="text-hub ml-auto">${this.context.tenantName}</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">Plan</span><span class="text-hub" style="color:var(--hub-deep)">${this.context.tenantPlan}</span></div>
          </div>
          <div class="section text-sm font-bold text-muted">Preferencias</div>
          <div class="card" style="padding:14px">
            <div class="feat flex items-center gap-sm"><span class="text-sm font-bold">Idioma</span><span class="text-hub ml-auto">Espanol</span></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">Tema</span><div class="switch ${this.state.theme === 'dark' ? 'on' : 'off'} ml-auto"><i></i></div></div>
            <div class="feat flex items-center gap-sm" style="margin-top:8px"><span class="text-sm font-bold">White-label</span><div class="switch off ml-auto"><i></i></div></div>
          </div>
        </div>`;

      default:
        return `<div class="view"><p class="text-sm text-muted">Selecciona una pestana</p></div>`;
    }
  }

  handleAction(action: string, params?: Record<string, unknown>): void {
    switch (action) {
      case "cycleMode": this.state = cycleMode(this.state); break;
      case "toggleTheme": this.state = toggleTheme(this.state); break;
      case "navigate": this.state = navigate(this.state, params?.tab as TabId ?? "inbox"); break;
      case "back": this.state = popSubPage(this.state); break;
    }
  }
}