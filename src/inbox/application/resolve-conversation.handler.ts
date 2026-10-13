import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId } from "../../shared/domain/ids.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";
import { transicionarStatus } from "../domain/conversation.entity.ts";

export interface ResolveConversationCommand {
  readonly conversationId: ConversationId;
}

export type ResolveConversationError =
  | { readonly kind: "conversacion_no_encontrada" }
  | { readonly kind: "ya_resuelta" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class ResolveConversationHandler {
  constructor(private readonly convRepo: ConversationRepository) {}

  async ejecutar(cmd: ResolveConversationCommand): Promise<Result<void, ResolveConversationError>> {
    const convResult = await this.convRepo.buscar(cmd.conversationId);
    if (!convResult.ok) return err({ kind: "conversacion_no_encontrada" });
    const conv = convResult.value;
    if (!conv) return err({ kind: "conversacion_no_encontrada" });

    const transResult = transicionarStatus(conv.status, "resolved");
    if (!transResult.ok) return err({ kind: "ya_resuelta" });

    return ok(undefined);
  }
}