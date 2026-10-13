/**
 * HUB by Raisen — Registro de interacciones del agente (BC Cognition).
 * Paso 6 del ciclo: materializa un AgentInteractionState y lo persiste en
 * agent_interactions (particionada).
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 *
 * P1 honesto: No existe repository implementado para agent_interactions.
 * `persistir` queda como port para el adapter Supabase; por defecto registra
 * en consola (stdout) simulando la escritura sin tocar la base.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { AgentInteractionState, CorrectionCategory } from "../domain/agent.service.ts";
import type { ConfidenceVO } from "../domain/confidence.vo.ts";

export type AgentInteractionError = { readonly kind: "persistence_failed"; readonly cause: string };

/** Port de persistencia hacia agent_interactions (P1: impl en infrastructure). */
export interface AgentInteractionRepository {
  registrar(interaction: AgentInteractionState): Promise<Result<void, AgentInteractionError>>;
}

export interface RegistrarInteractionInput {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly channel: string;
  readonly contactMessage: string | null;
  readonly reasoning: string | null;
  readonly confidencePre: ConfidenceVO | null;
  readonly agentResponse: string | null;
  readonly actionTaken: Readonly<Record<string, unknown>> | null;
  readonly model: string;
  readonly costUsd: number;
  readonly wasCorrect: boolean | null;
  readonly correctionCategory: CorrectionCategory | null;
}

export class AgentInteractionLogger {
  private readonly repo: AgentInteractionRepository | null;

  constructor(repo?: AgentInteractionRepository) {
    this.repo = repo ?? null;
  }

  registrar(input: RegistrarInteractionInput): Promise<Result<AgentInteractionState, AgentInteractionError>> {
    const interaction: AgentInteractionState = Object.freeze({
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date(),
    });
    // P1: sin repo real, se loguea en stdout y se devuelve el objeto intacto.
    console.log("[agent_interactions]", interaction.id, interaction.model);
    if (this.repo === null) {
      return Promise.resolve(ok(interaction));
    }
    return this.repo.registrar(interaction).then((r) => (r.ok ? ok(interaction) : r));
  }
}