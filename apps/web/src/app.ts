/**
 * HUB by Raisen — App shell (punto de entrada a la SPA).
 * Lógica de render/action en app-logic.ts, filtros en app-filters.ts (C4 ≤75).
 */
import type { PageState, TabId, InboxItem, AppContext, SafeSnapshot } from "./types.ts";
import { createInitialState } from "./navigation.ts";
import { renderCurrentTab, handleAction } from "./app-logic.ts";
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
    return this.inbox.find((i) => i.conversationId === conversationId)?.contactId ?? null;
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
    return renderCurrentTab(
      this.state,
      this.context,
      this.inbox,
      this.safeSnapshot,
      this.filtros.canalActual,
      this.filtros.estadoActual,
      this.filtros.slaActual,
    );
  }

  handleAction(action: string, params?: Record<string, unknown>): void {
    this.state = handleAction(this.state, action, params);
  }
}