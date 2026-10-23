import { Result, err, ok } from "../../shared/domain/result.ts";
import { MessageId, ConversationId, TenantId, ContactId, UserId } from "../../shared/domain/ids.ts";
import { MessageDirection, SenderType, ChannelType } from "../../shared/domain/types.ts";

export type ContentType =
  | "text" | "template" | "image" | "video" | "audio" | "document"
  | "location" | "contact_card" | "sticker" | "reaction" | "system_event";

export interface MessageContent {
  readonly type: ContentType;
  readonly body: string;
  readonly mediaUrl?: string | undefined; readonly mediaMime?: string | undefined;
}

export type AiMode = "assistant" | "copilot" | "autonomous";

export interface AiMeta {
  readonly interactionId: string | null;
  readonly confidence: number | null;
  readonly mode: AiMode | null;
  readonly editedByHuman: boolean;
}

export type MessageStatus =
  | "draft" | "sending" | "sent" | "delivered" | "read" | "failed" | "received";

export interface MessageState {
  readonly id: MessageId;
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly direction: MessageDirection;
  readonly senderType: SenderType;
  readonly senderUserId: UserId | null;
  readonly channel: ChannelType;
  readonly provider: string;
  readonly providerMessageId: string | null;
  readonly content: MessageContent;
  readonly hasAttachments: boolean;
  readonly status: MessageStatus;
  readonly aiMeta: AiMeta;
  readonly createdAt: Date;
}

export type MessageError =
  | { readonly kind: "contenido_vacio" }
  | { readonly kind: "tipo_invalido" };

export const crearMensaje = (
  conversationId: ConversationId,
  contactId: ContactId,
  tenantId: TenantId,
  direction: MessageDirection,
  senderType: SenderType,
  channel: ChannelType,
  provider: string,
  content: MessageContent,
  aiMeta: AiMeta = { interactionId: null, confidence: null, mode: null, editedByHuman: false },
): Result<MessageState, MessageError> => {
  if (content.type === "text" && !content.body.trim()) {
    return err({ kind: "contenido_vacio" });
  }
  return ok(Object.freeze({
    id: crypto.randomUUID() as MessageId,
    conversationId, contactId, tenantId,
    direction, senderType,
    senderUserId: senderType === "human_agent" ? crypto.randomUUID() as UserId : null,
    channel, provider,
    providerMessageId: null,
    content,
    hasAttachments: false,
    status: "sent",
    aiMeta: Object.freeze(aiMeta),
    createdAt: new Date(),
  }));
};