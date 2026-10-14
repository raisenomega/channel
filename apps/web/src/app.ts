/**
 * HUB by Raisen — App shell (punto de entrada a la SPA).
 * Estado de filtros en app-filters.ts (C4 ≤75).
 */
import type { PageState, TabId, InboxItem, AppContext, SafeSnapshot } from "./types.ts";
import { createInitialState, cycleMode, navigate, popSubPage } from "./navigation.ts";
import { renderTab } from "./tab-router.ts";
import { FiltrosInbox } from "./app-filters.ts";

export type CargarInbox = () => Promise<InboxItem[]>;
export type CargarSafe = () => Promise<SafeSnapshot | null>;

export class HUBApp {
  private state: PageState = createInitialState();
  private inbox: InboxItem[] = [];
  private safeSnapshot: SafeSnapshot | null = null;
  private filtros = new FiltrosInbox();

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
    this.filtros.toggleCanal(canal);
  }

  toggleFiltroEstado(estado: string): void {
    this.filtros.toggleEstado(estado);
  }

  toggleFiltroSLA(): void {
    this.filtros.toggleSLA();
  }

  toggleFiltroClean(): void {
    this.filtros.clean();
  }

  filtroActual(): string | null {
    return this.filtros.canalActual;
  }

  filtroEstadoActual(): string | null {
    return this.filtros.estadoActual;
  }

  filtroSLAActual(): boolean | null {
    return this.filtros.slaActual;
  }

  renderCurrentTab(): string {
    return renderTab(
      this.state.currentTab,
      this.context,
      this.inbox,
      this.safeSnapshot,
      this.filtros.canalActual,
      this.filtros.estadoActual,
      this.filtros.slaActual,
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