/**
 * HUB by Raisen — Sincroniza estado de plantilla tras webhook de Meta (Slide 4.9).
 * A-07: template_no_encontrado → la ruta loguea y retorna 200. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";

export interface SyncTemplateStatusCommand {
  readonly nombre: string;
  readonly language: string;
  readonly status: "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED";
  readonly reason: string | undefined;
}

export type SyncStatusError =
  | { readonly kind: "template_no_encontrado" }
  | { readonly kind: "status_desconocido" }
  | RepoError;

const STATUS_MAP: Record<string, string> = Object.freeze({
  APPROVED: "approved", REJECTED: "rejected", PAUSED: "paused", DISABLED: "disabled",
});

export class SyncTemplateStatusHandler {
  constructor(private readonly repo: WhatsAppTemplateRepository) {}

  async ejecutar(cmd: SyncTemplateStatusCommand): Promise<Result<number, SyncStatusError>> {
    const target = STATUS_MAP[cmd.status];
    if (!target) return err({ kind: "status_desconocido" });

    const templates = await this.repo.buscarPorNombre(cmd.nombre, cmd.language || undefined);
    if (!templates.ok) return err(templates.error);
    if (templates.value.length === 0) return err({ kind: "template_no_encontrado" });

    for (const t of templates.value) {
      const r = await this.repo.actualizarStatus(t.id, target as "approved" | "rejected" | "paused" | "disabled", cmd.reason);
      if (!r.ok) return err(r.error);
    }
    return ok(templates.value.length);
  }
}