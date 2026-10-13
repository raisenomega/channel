/**
 * HUB by Raisen — SLA: Caso de uso para crear una política SLA.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { SLAPriority, SLAPolicyState } from "../domain/sla-policy.entity.ts";
import { crearSLAPolicy } from "../domain/sla-policy.entity.ts";
import type { SLAPolicyRepository } from "../domain/sla.repository.ts";

export interface CreateSLAPolicyCommand {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly channel: ChannelType | null;
  readonly priority: SLAPriority;
  readonly responseTimeMinutes: number;
  readonly resolutionTimeMinutes: number;
  readonly escalationAfterMinutes: number;
  readonly businessHoursId: string | null;
}

export type CreateSLAPolicyHandlerError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "response_time_invalido" }
  | { readonly kind: "resolution_time_invalido" }
  | { readonly kind: "escalation_time_invalido" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class CreateSLAPolicyHandler {
  constructor(private readonly slaRepo: SLAPolicyRepository) {}

  async ejecutar(cmd: CreateSLAPolicyCommand): Promise<Result<SLAPolicyState, CreateSLAPolicyHandlerError>> {
    const policyResult = crearSLAPolicy(
      cmd.tenantId,
      cmd.name,
      cmd.channel,
      cmd.priority,
      cmd.responseTimeMinutes,
      cmd.resolutionTimeMinutes,
      cmd.escalationAfterMinutes,
      cmd.businessHoursId,
    );

    if (!policyResult.ok) {
      return err(policyResult.error);
    }

    const persistResult = await this.slaRepo.guardar(policyResult.value);
    if (!persistResult.ok) {
      return err({ kind: "persistence_failure", cause: causaDe(persistResult.error) });
    }

    return ok(policyResult.value);
  }
}

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}