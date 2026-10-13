import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { SLAPolicyState } from "../domain/sla-bizhours.entity.ts";
import { SLAPolicyRepository, RepoError } from "../domain/automation.repository.ts";

export interface CheckSLACommand {
  readonly tenantId: TenantId;
  readonly conversationId: string;
  readonly elapsedSeconds: number;
}

export class CheckSLAHandler {
  constructor(private readonly slaRepo: SLAPolicyRepository) {}

  async ejecutar(cmd: CheckSLACommand): Promise<Result<SLAPolicyState | null, CheckSLAError>> {
    const policiesResult = await this.slaRepo.buscarActivas(cmd.tenantId);
    if (!policiesResult.ok) return err({ kind: "persistence_failure", cause: causaDe(policiesResult.error) });

    for (const policy of policiesResult.value) {
      if (cmd.elapsedSeconds > policy.firstResponseSeconds) {
        return ok(policy);
      }
    }
    return ok(null);
  }
}

export type CheckSLAError =
  | { readonly kind: "persistence_failure"; readonly cause: string };

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}