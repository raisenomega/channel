import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, TenantId, ContactId, InboxId } from "../../shared/domain/ids.ts";
import { ConversationStatus, OperationMode, ChannelType } from "../../shared/domain/types.ts";
import { ConversationState, ConversationError, ConversationCreateError, STATUS_TRANSITIONS } from "./conversation.types.ts";

export type { ConversationState, ConversationError, ConversationCreateError } from "./conversation.types.ts";

export const transicionarStatus = (
  actual: ConversationStatus,
  nueva: ConversationStatus,
): Result<void, ConversationError> => {
  const permitidas = STATUS_TRANSITIONS[actual];
  if (!permitidas || !permitidas.includes(nueva)) {
    return err({ kind: "transicion_invalida" });
  }
  return ok(undefined);
};

export const crearConversacion = (
  tenantId: TenantId,
  contactId: ContactId,
  channel: ChannelType,
  inboxId: InboxId | null = null,
): Result<ConversationState, ConversationCreateError> => {
  if (!contactId) return err({ kind: "contacto_requerido" });
  return ok(Object.freeze({
    id: crypto.randomUUID() as ConversationId,
    tenantId, contactId,
    primaryChannel: channel,
    primaryInboxId: inboxId,
    status: "open" as ConversationStatus,
    operationMode: "human" as OperationMode,
    assignedAgentId: null,
    subject: null,
    priority: "medium",
    isStarred: false,
    totalMessages: 0, aiMessages: 0, humanMessages: 0,
    contactAskedIfBot: false, contactAskedForHuman: false,
    avgIndistinguishabilityScore: null,
    createdAt: new Date(),
  }));
};