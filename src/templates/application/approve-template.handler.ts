import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  WhatsAppTemplateState,
  TemplateStatus,
  transicionarStatus,
  TemplateError,
} from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";

/* ──────────────────────────────────────────
   Comando: aprobar/rechazar plantilla
   ────────────────────────────────────────── */
export interface ApproveTemplateCommand {
  readonly templateId: string;
  readonly tenantId: TenantId;
  readonly status: Extract<TemplateStatus, "approved" | "rejected">;
  readonly metaTemplateId?: string;
  readonly rejectionReason?: string;
}

export type ApproveTemplateError =
  | { readonly kind: "not_found" }
  | TemplateError
  | RepoError;

/* ──────────────────────────────────────────
   Handler
   ────────────────────────────────────────── */
export class ApproveTemplateHandler {
  constructor(private readonly templateRepo: WhatsAppTemplateRepository) {}

  async ejecutar(cmd: ApproveTemplateCommand): Promise<Result<void, ApproveTemplateError>> {
    const buscarResult = await this.templateRepo.buscar(cmd.templateId);
    if (!buscarResult.ok) return err(buscarResult.error);
    if (!buscarResult.value) return err({ kind: "not_found" });

    const current = buscarResult.value;

    // Validar transición de estado
    const transitionResult = transicionarStatus(current.status, cmd.status);
    if (!transitionResult.ok) return err(transitionResult.error);

    // Construir nuevo estado
    const updated: WhatsAppTemplateState = Object.freeze({
      ...current,
      status: cmd.status,
      metaTemplateId: cmd.metaTemplateId ?? current.metaTemplateId,
      rejectionReason: cmd.status === "rejected" ? (cmd.rejectionReason ?? null) : null,
      updatedAt: new Date(),
    });

    const guardarResult = await this.templateRepo.guardar(updated);
    if (!guardarResult.ok) return err(guardarResult.error);

    return ok(undefined);
  }
}