/**
 * HUB by Raisen — Tipos del contrato con CEREBRO (memoria compartida del ecosistema). Domain puro:
 * cero imports externos. El cliente (infra) y el emisor (app) usan estos tipos. C4 <=75.
 */
export type CerebroIdType = "phone" | "email" | "social_handle" | "local_id";

export interface CerebroIdentity {
  readonly idType: CerebroIdType;
  readonly idValue: string;
  readonly localId?: string;
}

export interface CerebroEvent {
  readonly event: "message.received" | "conversation.resolved" | "contact.updated" | "agent.consulta" | "agent.escalation";
  readonly sourcePlatform: "hub";
  readonly tenantId: string;
  readonly occurredAt: string;
  readonly identity: CerebroIdentity;
  readonly payload: Record<string, unknown>;
}

export interface CerebroRetrieveParams {
  readonly identity: CerebroIdentity;
  readonly query: string;
  readonly requestingAgent: string;
  readonly tenantId: string;
  readonly maxChunks?: number;
}

export interface CerebroChunk { readonly kind: string; readonly content: string; readonly sourcePlatform: string; readonly score: number; }
export interface CerebroFact { readonly text: string }
export interface CerebroContext {
  readonly personId: string | null;
  readonly chunks: readonly CerebroChunk[];
  readonly facts: readonly CerebroFact[];
  readonly degraded: boolean;
}
