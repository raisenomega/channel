import { Result, ok } from "../../shared/domain/result.ts";
import { ConversationId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { EthicsGuard } from "../domain/ethics.guard.ts";
import { decidirAccionPorConfianza, AutonomyConfigState } from "../domain/confidence.vo.ts";
import { AgentAction } from "../domain/agent-executor.ts";

export interface DecideResponseCommand {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly message: string;
  readonly channel: string;
  readonly confidence: number;
  readonly autonomyConfig: AutonomyConfigState;
}

export class DecideResponseHandler {
  async ejecutar(cmd: DecideResponseCommand): Promise<Result<AgentAction, DecideError>> {
    const ethicsResult = EthicsGuard.evaluar(cmd.message, "");
    if (!ethicsResult.ok) {
      return ok({ kind: "escalar", reason: ethicsResult.error.kind });
    }

    if (!cmd.autonomyConfig.isActive) {
      return ok({ kind: "no_actuar" });
    }

    const accion = decidirAccionPorConfianza(cmd.confidence);
    if (accion.kind === "escalar") {
      return ok({ kind: "escalar", reason: "confianza_insuficiente" });
    }

    return ok({ kind: "responder", text: "" });
  }
}

export type DecideError = Record<string, never>;