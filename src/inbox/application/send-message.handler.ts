import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { crearMensaje, MessageContent, AiMode } from "../domain/message.entity.ts";
import { ConversationRepository, MessageRepository } from "../domain/inbox.repository.ts";

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

// 3o-b/#1: puerto estructural para despachar el saliente (ChannelRouter encaja sin importar la capa channels).
export interface OutboundDispatcher {
  enviar(msg: { to: string; content: string; channel: ChannelType; conversationId?: string; accountId?: string }): Promise<Result<void, unknown>>;
}

export class SendMessageHandler {
  constructor(
    private readonly convRepo: ConversationRepository,
    private readonly msgRepo: MessageRepository,
    private readonly dispatcher?: OutboundDispatcher, // 3o-b: entrega real (Zernio); opcional = solo persiste
  ) {}

  async ejecutar(cmd: SendMessageCommand): Promise<Result<void, SendMessageError>> {
    const convResult = await this.convRepo.buscar(cmd.conversationId);
    if (!convResult.ok) return err({ kind: "conversacion_no_encontrada" });
    const conv = convResult.value;
    if (!conv) return err({ kind: "conversacion_no_encontrada" });

    // Un envío HUMANO retoma el ticket resuelto (lo reabre) y continúa; IA/system sí se bloquean.
    if (conv.status === "resolved" && cmd.senderType !== "human_agent") return err({ kind: "conversacion_resuelta" });
    if (conv.status === "resolved") await this.convRepo.guardar(Object.freeze({ ...conv, status: "open" as typeof conv.status }));

    const aiMeta = cmd.senderType === "ai_agent"
      ? { interactionId: cmd.aiInteractionId ?? null, confidence: cmd.aiConfidence ?? null, mode: cmd.aiMode ?? null, editedByHuman: false }
      : { interactionId: null, confidence: null, mode: null, editedByHuman: false };

    const msgResult = crearMensaje(
      cmd.conversationId, cmd.contactId, cmd.tenantId,
      "outbound", cmd.senderType, cmd.channel, cmd.provider,
      cmd.content, aiMeta,
    );
    if (!msgResult.ok) return err({ kind: "contenido_vacio" });

    const persistir = await this.msgRepo.guardar(msgResult.value);
    if (!persistir.ok) {
      const cause = "cause" in persistir.error ? persistir.error.cause : "fallo_persistencia";
      return err({ kind: "persistence_failure", cause });
    }

    // 3o-b/#1: entrega real por el inbox de Zernio (conversationId=ruta, accountId=body; ambos del webhook).
    // Best-effort: si faltan (hilo viejo) o falla, el mensaje queda persistido/visible (el adapter dead-letterea).
    if (this.dispatcher && conv.providerConversationId && conv.providerAccountId && cmd.content.body) {
      try { await this.dispatcher.enviar({ to: conv.participantExternalId ?? "", content: cmd.content.body, channel: cmd.channel, conversationId: conv.providerConversationId, accountId: conv.providerAccountId }); } catch { /* best-effort: ya persistio; el adapter dead-letterea */ }
    }
    return ok(undefined);
  }
}