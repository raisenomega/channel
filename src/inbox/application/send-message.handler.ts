import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { crearMensaje, MessageContent, AiMode } from "../domain/message.entity.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";
import { transicionarStatus } from "../domain/conversation.entity.ts";

export interface SendMessageCommand {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly channel: ChannelType;
  readonly provider: string;
  readonly content: MessageContent;
  readonly senderType: "human_agent" | "ai_agent" | "system";
  readonly aiMode?: AiMode;
  readonly aiConfidence?: number;
  readonly aiInteractionId?: string;
}

export type SendMessageError =
  | { readonly kind: "conversacion_no_encontrada" }
  | { readonly kind: "conversacion_resuelta" }
  | { readonly kind: "contenido_vacio" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class SendMessageHandler {
  constructor(private readonly convRepo: ConversationRepository) {}

  async ejecutar(cmd: SendMessageCommand): Promise<Result<void, SendMessageError>> {
    const convResult = await this.convRepo.buscar(cmd.conversationId);
    if (!convResult.ok) return err({ kind: "conversacion_no_encontrada" });
    const conv = convResult.value;
    if (!conv) return err({ kind: "conversacion_no_encontrada" });

    const transResult = transicionarStatus(conv.status, "open");
    if (!transResult.ok && conv.status === "resolved") {
      return err({ kind: "conversacion_resuelta" });
    }

    const aiMeta = cmd.senderType === "ai_agent"
      ? { interactionId: cmd.aiInteractionId ?? null, confidence: cmd.aiConfidence ?? null, mode: cmd.aiMode ?? null, editedByHuman: false }
      : { interactionId: null, confidence: null, mode: null, editedByHuman: false };

    const msgResult = crearMensaje(
      cmd.conversationId, cmd.contactId, cmd.tenantId,
      "outbound", cmd.senderType, cmd.channel, cmd.provider,
      cmd.content, aiMeta,
    );
    if (!msgResult.ok) return err({ kind: "contenido_vacio" });

    return ok(undefined);
  }
}