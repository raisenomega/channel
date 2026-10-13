import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { crearEquipo } from "../domain/team.entity.ts";
import { TeamRepository } from "../domain/agents.repository.ts";

export interface CreateTeamCommand {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description?: string;
}

export type CreateTeamError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "nombre_requerido" }
  | { readonly kind: "duplicado"; readonly campo: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class CreateTeamHandler {
  constructor(private readonly teamRepo: TeamRepository) {}

  async ejecutar(cmd: CreateTeamCommand): Promise<Result<void, CreateTeamError>> {
    const options: { description?: string } = {};
    if (cmd.description !== undefined) options.description = cmd.description;

    const crear = crearEquipo(cmd.tenantId, cmd.name, options);
    if (!crear.ok) return err(crear.error);

    const persistir = await this.teamRepo.guardar(crear.value);
    if (!persistir.ok) {
      if (persistir.error.kind === "duplicado") {
        return err({ kind: "duplicado", campo: persistir.error.campo });
      }
      if (persistir.error.kind === "persistence_failure") {
        return err({ kind: "persistence_failure", cause: persistir.error.cause });
      }
      return err({ kind: "persistence_failure", cause: "not_found" });
    }
    return ok(undefined);
  }
}