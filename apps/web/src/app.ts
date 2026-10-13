import type { PageState, TabId, InboxItem, InboxFilter } from "./types.ts";
import { createInitialState, cycleMode, toggleTheme, navigate, pushSubPage, popSubPage } from "./navigation.ts";
import { renderInboxList, renderFilterChips } from "./inbox-widget.ts";
import { renderAgentDashboard } from "./agent-dashboard.ts";
import { renderChannelSettings } from "./channel-settings.ts";

export class HUBApp {
  private state: PageState = createInitialState();

  private readonly channels = [
    { id: "whatsapp", name: "WhatsApp", active: true, autonomous: true, status: "Conectado" },
    { id: "email", name: "Email", active: true, autonomous: true, status: "via Resend" },
    { id: "instagram", name: "Instagram", active: true, autonomous: true, status: "via Zernio" },
    { id: "facebook", name: "Facebook", active: true, autonomous: true, status: "via Zernio" },
    { id: "telegram", name: "Telegram", active: true, autonomous: true, status: "via Zernio" },
    { id: "sms", name: "SMS", active: true, autonomous: false, status: "via Zernio" },
    { id: "x", name: "X / Twitter", active: true, autonomous: false, status: "Degradado" },
    { id: "linkedin", name: "LinkedIn", active: false, autonomous: false, status: "Sin conectar" },
  ];

  private readonly mockInbox: InboxItem[] = [
    { conversationId: "c1", contactName: "Luis Rodriguez", channel: "whatsapp", lastMessage: "Perfecto! Orden confirmada. Total $24.", lastMessageAt: new Date(Date.now() - 180000), unreadCount: 2, status: "open", assignedTo: "IA", slaViolated: false, mode: "autonomous" },
    { conversationId: "c2", contactName: "Genesis Fontanez", channel: "instagram", lastMessage: "Tienen opciones sin gluten?", lastMessageAt: new Date(Date.now() - 600000), unreadCount: 1, status: "open", assignedTo: null, slaViolated: false, mode: "escalated" },
    { conversationId: "c3", contactName: "Visitante web #A19", channel: "webchat", lastMessage: "A que hora cierran hoy?", lastMessageAt: new Date(Date.now() - 120000), unreadCount: 0, status: "open", assignedTo: "IA", slaViolated: false, mode: "autonomous" },
    { conversationId: "c4", contactName: "Caribe Foods", channel: "email", lastMessage: "Adjunto cotizacion actualizada", lastMessageAt: new Date(Date.now() - 3600000), unreadCount: 0, status: "pending", assignedTo: null, slaViolated: true, mode: "human" },
    { conversationId: "c5", contactName: "@josuecomer", channel: "x", lastMessage: "Hacen delivery a Bayamon?", lastMessageAt: new Date(Date.now() - 7200000), unreadCount: 0, status: "open", assignedTo: null, slaViolated: false, mode: "human" },
  ];

  renderCurrentTab(): string {
    switch (this.state.currentTab) {
      case "inbox":
        return `<div class="view">
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Conversaciones</div><div class="kpi-value">23<small>hoy</small></div></div>
            <div class="kpi"><div class="kpi-label">IA Was Correct</div><div class="kpi-value" style="color:var(--good)">94<small>%</small></div></div>
            <div class="kpi"><div class="kpi-label">Ventas desde chat</div><div class="kpi-value" style="color:var(--hub)">$589<small>hoy</small></div></div>
            <div class="kpi"><div class="kpi-label">Autonomia</div><div class="kpi-value">87<small>%</small></div></div>
          </div>
          <div class="section text-sm font-bold text-muted">Canales <span class="more text-xs text-hub">Ver todos</span></div>
          ${renderFilterChips([], this.channels.map((c) => c.id))}
          <div class="section text-sm font-bold text-muted">Conversaciones activas <span class="more text-xs text-hub">Ver todas</span></div>
          <div class="list">${renderInboxList(this.mockInbox, [])}</div>
        </div>`;

      case "agent":
        return renderAgentDashboard(94, 92, 87, "1.45s", "Anthropic Claude", "claude-sonnet-4-6", true, "DeepSeek", this.state.mode);

      case "channels":
        return renderChannelSettings(this.channels);

      case "settings":
        return `<div class="view">
          <div class="section text-sm font-bold text-muted">Integraciones del ecosistema</div>
          <div class="list">
            <div class="row flex items-center gap px-lg py-sm"><span class="text-sm font-bold">NUCLEO</span><span class="text-xs text-muted ml-auto">ERP · CRM · facturacion</span><span class="badge badge-good text-xs">Activo</span></div>
            <div class="row flex items-center gap px-lg py-sm"><span class="text-sm font-bold">OMEGA</span><span class="text-xs text-muted ml-auto">Brand Voice · campanas</span><span class="badge badge-good text-xs">Activo</span></div>
            <div class="row flex items-center gap px-lg py-sm"><span class="text-sm font-bold">POS</span><span class="text-xs text-muted ml-auto">Recibos · compras</span><span class="badge badge-good text-xs">Activo</span></div>
            <div class="row flex items-center gap px-lg py-sm"><span class="text-sm font-bold">TABLE</span><span class="text-xs text-muted ml-auto">Reservas</span><span class="badge badge-good text-xs">Activo</span></div>
            <div class="row flex items-center gap px-lg py-sm"><span class="text-sm font-bold">SAFE</span><span class="text-xs text-muted ml-auto">Auditoria continua</span><span class="badge badge-good text-xs">Activo</span></div>
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