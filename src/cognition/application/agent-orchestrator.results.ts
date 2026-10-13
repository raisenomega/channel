/**
 * HUB by Raisen — Fabrica de resultados terminales del orquestador.
 * Encapsula los estados que cortan el ciclo (inactivo, bloqueado, escalado).
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { ConfidenceVO } from "../domain/confidence.vo.ts";
import type { AgentAction } from "../domain/agent-executor.ts";
import type { AgentOrchestratorResult, OrchestratorError } from "./agent-orchestrator.types.ts";

export type ModeDecision = "escalar" | "no_actuar" | "safe_blocked";

export class OrchestratorResults {
  terminal(
    mode: ModeDecision,
    confidence: ConfidenceVO,
  ): Result<AgentOrchestratorResult, OrchestratorError> {
    const action: AgentAction = mode === "no_actuar"
      ? Object.freeze({ kind: "no_actuar" as const })
      : Object.freeze({ kind: "escalar" as const, reason: mode });
    return ok(Object.freeze({
      response: null,
      action,
      confidence,
      modelUsed: "",
      costUsd: 0,
      toolExecuted: null,
      escalated: mode !== "no_actuar",
      interactionId: null,
    }));
  }
}