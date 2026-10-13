import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, TenantId, ContactId, InboxId, AgentId } from "../../shared/domain/ids.ts";
import { ConversationStatus, OperationMode, ChannelType } from "../../shared/domain/types.ts";
import { Language } from "../../shared/domain/locale.vo.ts";

export interface ConversationState {
  readonly id: ConversationId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly primaryChannel: ChannelType;
  readonly primaryInboxId: InboxId | null;
  readonly status: ConversationStatus;
  readonly operationMode: OperationMode;
  readonly assignedAgentId: AgentId | null;
  readonly subject: string | null;
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly isStarred: boolean;
  readonly totalMessages: number;
  readonly aiMessages: number;
  readonly humanMessages: number;
  readonly contactAskedIfBot: boolean;
  readonly contactAskedForHuman: boolean;
  readonly avgIndistinguishabilityScore: number | null;
  readonly createdAt: Date;
}

export type ConversationError =
  | { readonly kind: "contacto_requerido" }
  | { readonly kind: "conversacion_resuelta" }
  | { readonly kind: "conversacion_archivada" }
  | { readonly kind: "transicion_invalida" };

const statusTransitions: Readonly<Record<ConversationStatus, readonly ConversationStatus[]>> = {
  open: ["pending", "snoozed", "resolved", "archived"],
  pending: ["open", "resolved", "snoozed"],
  snoozed: ["open", "resolved"],
  resolved: ["open"],
  archived: [],
};

export const transicionarStatus = (
  actual: ConversationStatus,
  nueva: ConversationStatus,
): Result<void, ConversationError> => {
  const permitidas = statusTransitions[actual];
  if (!permitidas || !permitidas.includes(nueva)) {
    return err({ kind: "transicion_invalida" });
  }
  return ok(undefined);
};

export type ConversationCreateError = { readonly kind: "contacto_requerido" };

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