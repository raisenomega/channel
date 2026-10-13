import { Result, err, ok } from "../../shared/domain/result.ts";
import { AgentId, TeamId } from "../../shared/domain/ids.ts";
import { agregarMiembro } from "../domain/team.entity.ts";
import { AgentRepository, TeamRepository } from "../domain/agents.repository.ts";

export interface AssignAgentCommand {
  readonly teamId: TeamId;
  readonly agentId: AgentId;
}

export type AssignAgentError =
  | { readonly kind: "equipo_no_encontrado" }
  | { readonly kind: "agente_no_encontrado" }
  | { readonly kind: "agente_inactivo" }
  | { readonly kind: "miembro_duplicado" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class AssignAgentHandler {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly teamRepo: TeamRepository,
  ) {}

  async ejecutar(cmd: AssignAgentCommand): Promise<Result<void, AssignAgentError>> {
    const teamResult = await this.teamRepo.buscar(cmd.teamId);
    if (!teamResult.ok || !teamResult.value) return err({ kind: "equipo_no_encontrado" });
    const equipo = teamResult.value;

    const agentResult = await this.agentRepo.buscar(cmd.agentId);
    if (!agentResult.ok || !agentResult.value) return err({ kind: "agente_no_encontrado" });
    if (!agentResult.value.isActive) return err({ kind: "agente_inactivo" });

    const nuevoMiembro = agregarMiembro(equipo, cmd.agentId);
    if (!nuevoMiembro.ok) {
      if (nuevoMiembro.error.kind === "equipo_inactivo") return err({ kind: "agente_inactivo" });
      return err({ kind: "miembro_duplicado" });
    }

    const persistir = await this.teamRepo.agregarMiembro(cmd.teamId, cmd.agentId);
    if (!persistir.ok) {
      if (persistir.error.kind === "duplicado") return err({ kind: "miembro_duplicado" });
      if (persistir.error.kind === "persistence_failure") {
        return err({ kind: "persistence_failure", cause: persistir.error.cause });
      }
      return err({ kind: "persistence_failure", cause: "not_found" });
    }
    return ok(undefined);
  }
}