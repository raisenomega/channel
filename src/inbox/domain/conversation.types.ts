/**
 * HUB by Raisen — Inbox: tipos puras de conversacion.
 * Extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { ConversationId, TenantId, ContactId, InboxId, AgentId } from "../../shared/domain/ids.ts";
import type { ConversationStatus, OperationMode, ChannelType } from "../../shared/domain/types.ts";

export interface ConversationState {
  readonly id: ConversationId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly participantExternalId: string | null; // id del destinatario en la plataforma (Zernio `to`)
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

export type ConversationCreateError = { readonly kind: "contacto_requerido" };

export const STATUS_TRANSITIONS: Readonly<Record<ConversationStatus, readonly ConversationStatus[]>> = {
  open: ["pending", "snoozed", "resolved", "archived"],
  pending: ["open", "resolved", "snoozed"],
  snoozed: ["open", "resolved"],
  resolved: ["open"],
  archived: [],
};