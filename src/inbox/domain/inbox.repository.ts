import { Result } from "../../shared/domain/result.ts";
import { ConversationId, TenantId, ContactId, AgentId, MessageId } from "../../shared/domain/ids.ts";
import { ConversationState } from "./conversation.entity.ts";
import type { MessageState } from "./message.entity.ts";

export type ConversationEvent =
  | { readonly type: "conversation.created"; readonly conversationId: ConversationId; readonly occurredAt: Date }
  | { readonly type: "conversation.status_changed"; readonly conversationId: ConversationId; readonly from: string; readonly to: string; readonly occurredAt: Date }
  | { readonly type: "message.received"; readonly conversationId: ConversationId; readonly messageId: string; readonly occurredAt: Date }
  | { readonly type: "message.sent"; readonly conversationId: ConversationId; readonly messageId: string; readonly occurredAt: Date }
  | { readonly type: "conversation.assigned"; readonly conversationId: ConversationId; readonly agentId: AgentId; readonly occurredAt: Date }
  | { readonly type: "conversation.resolved"; readonly conversationId: ConversationId; readonly occurredAt: Date };

export interface ConversationRepository {
  guardar(conv: ConversationState): Promise<Result<void, RepoError>>;
  buscar(id: ConversationId): Promise<Result<ConversationState | null, RepoError>>;
  buscarPorContacto(tenantId: TenantId, contactId: ContactId): Promise<Result<ConversationState[], RepoError>>;
  buscarActivos(tenantId: TenantId): Promise<Result<ConversationState[], RepoError>>;
}

export interface MessageRepository {
  guardar(msg: MessageState): Promise<Result<void, RepoError>>;
  buscar(id: MessageId): Promise<Result<MessageState | null, RepoError>>;
  buscarPorConversacion(convId: ConversationId, limit?: number): Promise<Result<MessageState[], RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };