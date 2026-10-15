/**
 * HUB by Raisen — MarkReadHandler: marca notificacion como leida.
 * Idempotente: si ya leida, no re-escribe read_at (pag 5.3/5.5).
 * C4 ≤50 lineas.
 */
import { Result, err } from "../../shared/domain/result.ts";

export interface MarkReadCommand {
  readonly id: string;
  readonly userId: string;
}

export class MarkReadHandler {
  constructor(private readonly repo: { marcarLeida(id: string, userId: string): Promise<Result<void, string>> }) {}

  async ejecutar(cmd: MarkReadCommand): Promise<Result<void, string>> {
    if (!cmd.id || !cmd.userId) return err("campos_requeridos");
    // El repo es responsable de hacer la idempotencia (no sobreescribir si ya leída)
    return this.repo.marcarLeida(cmd.id, cmd.userId);
  }
}