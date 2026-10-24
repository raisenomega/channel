/**
 * HUB by Raisen — Sistema B fase 1: escanea conversaciones QUIETAS (sin actividad >= N horas) y las
 * registra. Orquestador puro sobre un puerto de busqueda (testeable sin DB). Base del borrador de cierre. C4 <=75.
 */
export interface QuietConv {
  readonly id: string;
  readonly tenantId: string;
  readonly contactId: string | null;
  readonly lastMessageAt: string | null;
}

export type BuscarQuietas = (horasQuieto: number) => Promise<readonly QuietConv[]>;

export class FollowupScanner {
  constructor(private readonly buscar: BuscarQuietas) {}

  async escanear(horasQuieto: number): Promise<number> {
    const quietas = await this.buscar(horasQuieto);
    for (const c of quietas) console.error(`[followup] quieta conv=${c.id} tenant=${c.tenantId} last=${c.lastMessageAt ?? "null"}`);
    console.error(`[followup] scan: ${quietas.length} conversaciones quietas (>=${horasQuieto}h)`);
    return quietas.length;
  }
}
