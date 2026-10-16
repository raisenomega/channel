import { Result, ok } from "../../shared/domain/result.ts";
import { ConversationId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { EthicsGuard } from "../domain/ethics.guard.ts";
import { decidirAccionPorConfianza, AutonomyConfigState } from "../domain/confidence.vo.ts";
import { AgentAction } from "../domain/agent-executor.ts";
import { LIMITS } from "../domain/limits.ts";

export interface DecideResponseCommand {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly message: string;
  readonly channel: string;
  readonly confidence: number;
  readonly autonomyConfig: AutonomyConfigState;
  readonly personaSlug: string;
  readonly draftContent: string;        // contenido real del draft, no vacio
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

    // I9: confidence hold en codigo (escala 0-10), no en prompt
    const confidence10 = Math.round(cmd.confidence * 10);
    if (confidence10 < LIMITS.MIN_CONFIDENCE_TO_ACT) {
      return ok({
        kind: "hold_for_human_review",
        reason: "confidence_below_threshold",
        confidence: confidence10,
        threshold: LIMITS.MIN_CONFIDENCE_TO_ACT,
        draftContent: cmd.draftContent,
        personaSlug: cmd.personaSlug,
      });
    }

    const accion = decidirAccionPorConfianza(cmd.confidence);
    if (accion.kind === "escalar") {
      return ok({ kind: "escalar", reason: "confianza_insuficiente" });
    }
    return ok({ kind: "responder", text: "" });
  }
}

export type DecideError = Record<string, never>;