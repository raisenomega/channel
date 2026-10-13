/**
 * HUB by Raisen — SAFE: tipos del evaluador de ensemble.
 * Extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { TenantId } from "../../shared/domain/ids.ts";
import type { Result } from "../../shared/domain/result.ts";

export interface SafeEvalContext {
  readonly interactionId: string | null;
  readonly inputMessage: string;
  readonly agentResponse: string;
  readonly actionTaken: Readonly<Record<string, unknown>> | null;
  readonly confidence: number;
  readonly channel: string;
  readonly contactSegment: string | null;
  readonly tenantId: TenantId;
}

export interface SafeEvalResult {
  readonly approved: boolean;
  readonly score: number;
  readonly reason: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface SAFEEvaluator {
  readonly provider: string;
  evaluar(context: SafeEvalContext): Promise<Result<SafeEvalResult, string>>;
}

export interface SAFEEvaluation {
  readonly decision: "approved" | "blocked" | "abstained";
  readonly disagreementPct: number;
  readonly details: Readonly<Record<string, unknown>>;
}

export type SafeEvalError =
  | { readonly kind: "evaluator_failed"; readonly cause: string };