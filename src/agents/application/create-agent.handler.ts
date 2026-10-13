import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, UserId } from "../../shared/domain/ids.ts";
import { Role } from "../../shared/domain/types.ts";
import { AgentType, crearAgente } from "../domain/agent.entity.ts";
import { AgentRepository } from "../domain/agents.repository.ts";

export interface CreateAgentCommand {
  readonly tenantId: TenantId;
  readonly displayName: string;
  readonly agentType: AgentType;
  readonly role: Role;
  readonly userId?: UserId;
  readonly email?: string;
  readonly avatarUrl?: string;
}

export type CreateAgentError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "nombre_requerido" }
  | { readonly kind: "tipo_agente_invalido" }
  | { readonly kind: "rol_invalido" }
  | { readonly kind: "duplicado"; readonly campo: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class CreateAgentHandler {
  constructor(private readonly agentRepo: AgentRepository) {}

  async ejecutar(cmd: CreateAgentCommand): Promise<Result<void, CreateAgentError>> {
    const options: { userId?: UserId; email?: string; avatarUrl?: string } = {};
    if (cmd.userId !== undefined) options.userId = cmd.userId;
    if (cmd.email !== undefined) options.email = cmd.email;
    if (cmd.avatarUrl !== undefined) options.avatarUrl = cmd.avatarUrl;

    const crear = crearAgente(cmd.tenantId, cmd.displayName, cmd.agentType, cmd.role, options);
    if (!crear.ok) return err(crear.error);

    const persistir = await this.agentRepo.guardar(crear.value);
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