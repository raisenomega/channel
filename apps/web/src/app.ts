/**
 * HUB by Raisen — App shell (punto de entrada a la SPA).
 * Gestiona estado, inbox, filtro de canal, SAFE governance y delega render en tab-router.
 */
import type { PageState, TabId, InboxItem, AppContext, SafeSnapshot } from "./types.ts";
import { createInitialState, cycleMode, navigate, popSubPage } from "./navigation.ts";
import { renderTab } from "./tab-router.ts";

export type CargarInbox = () => Promise<InboxItem[]>;
export type CargarSafe = () => Promise<SafeSnapshot | null>;

export class HUBApp {
  private state: PageState = createInitialState();
  private inbox: InboxItem[] = [];
  private safeSnapshot: SafeSnapshot | null = null;
  private filtroCanal: string | null = null;
  private filtroEstado: string | null = null;
  private filtroSLA: boolean | null = null;

  constructor(
    private readonly context: AppContext,
    private readonly cargarInbox: CargarInbox,
    private readonly cargarSafe: CargarSafe,
  ) {}

  async iniciar(): Promise<void> {
    try {
      this.inbox = await this.cargarInbox();
    } catch {
      this.inbox = [];
    }
    try {
      this.safeSnapshot = await this.cargarSafe();
    } catch {
      this.safeSnapshot = null;
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

  toggleFiltroEstado(estado: string): void {
    this.filtroEstado = this.filtroEstado === estado ? null : estado;
  }

  toggleFiltroSLA(): void {
    this.filtroSLA = this.filtroSLA === true ? null : true;
  }

  /** Limpia todos los filtros del inbox (canal, estado y SLA). */
  toggleFiltroClean(): void {
    this.filtroCanal = null;
    this.filtroEstado = null;
    this.filtroSLA = null;
  }

  filtroActual(): string | null {
    return this.filtroCanal;
  }

  filtroEstadoActual(): string | null {
    return this.filtroEstado;
  }

  filtroSLAActual(): boolean | null {
    return this.filtroSLA;
  }

  renderCurrentTab(): string {
    return renderTab(
      this.state.currentTab,
      this.context,
      this.inbox,
      this.safeSnapshot,
      this.filtroCanal,
      this.filtroEstado,
      this.filtroSLA,
    );
  }

  handleAction(action: string, params?: Record<string, unknown>): void {
    switch (action) {
      case "cycleMode": this.state = cycleMode(this.state); break;
      case "navigate": this.state = navigate(this.state, params?.tab as TabId ?? "inbox"); break;
      case "back": this.state = popSubPage(this.state); break;
    }
  }
}