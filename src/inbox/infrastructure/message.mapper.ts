import { MessageId, ConversationId, TenantId } from "../../shared/domain/ids.ts";
import { MessageState } from "../../inbox/domain/message.entity.ts";

export const desdeRowMessage = (row: Record<string, unknown>): MessageState =>
  Object.freeze({
    id: row.id as MessageId,
    tenantId: row.tenant_id as TenantId,
    conversationId: row.conversation_id as ConversationId,
    contactId: row.contact_id as ConversationId as never,
    direction: row.direction as MessageState["direction"],
    senderType: row.sender_type as MessageState["senderType"],
    senderUserId: null,
    channel: row.channel as MessageState["channel"],
    provider: row.provider as string,
    providerMessageId: row.provider_message_id as string ?? null,
    content: Object.freeze({ type: row.content_type as never, body: row.content as string }),
    hasAttachments: (row.has_attachments as boolean) ?? false,
    status: row.status as MessageState["status"],
    aiMeta: Object.freeze({
      interactionId: row.ai_agent_interaction_id as string ?? null,
      confidence: row.ai_confidence as number ?? null,
      mode: row.ai_mode as never,
      editedByHuman: (row.ai_was_edited_by_human as boolean) ?? false,
    }),
    createdAt: new Date(row.created_at as string),
  });