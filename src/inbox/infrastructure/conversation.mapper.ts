import { ConversationId, TenantId, ContactId } from "../../shared/domain/ids.ts";
import { ConversationState } from "../../inbox/domain/conversation.entity.ts";

export const desdeRowConversation = (row: Record<string, unknown>): ConversationState =>
  Object.freeze({
    id: row.id as ConversationId,
    tenantId: row.tenant_id as TenantId,
    contactId: row.contact_id as ContactId,
    participantExternalId: (row.participant_external_id as string) ?? null,
    primaryChannel: row.primary_channel as ConversationState["primaryChannel"],
    primaryInboxId: null,
    status: row.status as ConversationState["status"],
    operationMode: row.operation_mode as ConversationState["operationMode"],
    assignedAgentId: row.assigned_agent_id as ConversationState["assignedAgentId"] ?? null,
    subject: row.subject as string ?? null,
    priority: row.priority as ConversationState["priority"],
    isStarred: row.is_starred as boolean,
    totalMessages: (row.total_messages as number) ?? 0,
    aiMessages: (row.ai_messages as number) ?? 0,
    humanMessages: (row.human_messages as number) ?? 0,
    contactAskedIfBot: row.contact_asked_if_bot as boolean,
    contactAskedForHuman: row.contact_asked_for_human as boolean,
    avgIndistinguishabilityScore: row.avg_indistinguishability_score as number ?? null,
    createdAt: new Date(row.created_at as string),
  });