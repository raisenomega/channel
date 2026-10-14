/**
 * HUB by Raisen — Estado de filtros del inbox.
 */
export class FiltrosInbox {
  private canal: string | null = null;
  private estado: string | null = null;
  private sla: boolean | null = null;

  toggleCanal(canal: string): void {
    this.canal = this.canal === canal ? null : canal;
  }

  toggleEstado(estado: string): void {
    this.estado = this.estado === estado ? null : estado;
  }

  toggleSLA(): void {
    this.sla = this.sla === true ? null : true;
  }

  clean(): void {
    this.canal = null;
    this.estado = null;
    this.sla = null;
  }

  get canalActual(): string | null {
    return this.canal;
  }

  get estadoActual(): string | null {
    return this.estado;
  }

  get slaActual(): boolean | null {
    return this.sla;
  }
}