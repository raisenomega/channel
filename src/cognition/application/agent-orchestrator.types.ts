/**
 * HUB by Raisen — DTOs del Agent Orchestrator (BC Cognition).
 * Separados del handler para cumplir C4 (< 75 lineas por archivo).
 *
 * Pattern Result<T, E>. Sin any.
 */
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";
import type { AutonomyConfigState, ConfidenceVO } from "../domain/confidence.vo.ts";
import type { AgentAction } from "../domain/agent-executor.ts";

export interface AgentOrchestratorCommand {
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly normalizedMessage: NormalizedMessage;
  readonly autonomyConfig: AutonomyConfigState;
  readonly channel: ChannelType;
}

export interface AgentOrchestratorResult {
  readonly response: string | null;
  readonly action: AgentAction;
  readonly confidence: ConfidenceVO;
  readonly modelUsed: string;
  readonly costUsd: number;
  readonly toolExecuted: string | null;
  readonly escalated: boolean;
  readonly interactionId: string | null;
}

export type OrchestratorError =
  | { readonly kind: "ethics_violation" }
  | { readonly kind: "no_provider_available" }
  | { readonly kind: "llm_failure"; readonly cause: string }
  | { readonly kind: "safe_blocked" }
  | { readonly kind: "tool_execution_failed"; readonly cause: string }
  | { readonly kind: "context_failed"; readonly cause: string }
  | { readonly kind: "registration_failed"; readonly cause: string };