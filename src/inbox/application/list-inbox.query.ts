import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, AgentId } from "../../shared/domain/ids.ts";
import { ConversationStatus } from "../../shared/domain/types.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";
import { ConversationState } from "../domain/conversation.entity.ts";

export interface ListInboxQuery {
  readonly tenantId: TenantId;
  readonly status: ConversationStatus | "all";
  readonly assignedAgentId: AgentId | null;
  readonly limit: number;
}

export class ListInboxHandler {
  constructor(private readonly convRepo: ConversationRepository) {}

  async ejecutar(q: ListInboxQuery): Promise<Result<ConversationState[], ListInboxError>> {
    const result = await this.convRepo.buscarActivos(q.tenantId);
    if (!result.ok) return err({ kind: "persistence_failure", cause: causaDe(result.error) });

    let items = result.value;
    if (q.status !== "all") items = items.filter(c => c.status === q.status);

    return ok(items.slice(0, q.limit));
  }
}

export type ListInboxError =
  | { readonly kind: "persistence_failure"; readonly cause: string };

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}