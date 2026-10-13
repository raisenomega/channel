import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, AgentId } from "../../shared/domain/ids.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";

export interface AssignConversationCommand {
  readonly conversationId: ConversationId;
  readonly agentId: AgentId;
}

export type AssignConversationError =
  | { readonly kind: "conversacion_no_encontrada" }
  | { readonly kind: "conversacion_resuelta" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class AssignConversationHandler {
  constructor(private readonly convRepo: ConversationRepository) {}

  async ejecutar(cmd: AssignConversationCommand): Promise<Result<void, AssignConversationError>> {
    const convResult = await this.convRepo.buscar(cmd.conversationId);
    if (!convResult.ok) return err({ kind: "conversacion_no_encontrada" });
    const conv = convResult.value;
    if (!conv) return err({ kind: "conversacion_no_encontrada" });
    if (conv.status === "resolved") return err({ kind: "conversacion_resuelta" });
    return ok(undefined);
  }
}