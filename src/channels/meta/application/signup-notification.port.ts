/**
 * HUB by Raisen — Puerto para emitir notificacion desde el callback de signup.
 * Best-effort: evita acoplamiento circular con notifications BC.
 * C4 ≤40 lineas.
 */
import type { Result } from "../../../shared/domain/result.ts";

export interface SignupNotificationPort {
  ejecutar(cmd: {
    tenantId: string; userId: string; type: string; severity?: string;
    title: string; body?: string; payload?: Record<string, unknown>;
  }): Promise<Result<unknown, unknown>>;
}