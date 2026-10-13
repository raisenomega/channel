import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { SAFEEvaluationState, EvalType, EvalStatus, FinalDecision } from "./safe-governance.entity.ts";

export interface SAFEEvaluator {
  readonly provider: string;
  evaluar(context: SafeEvalContext): Promise<Result<SafeEvalResult, string>>;
}

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

export class SafePreSendHandler {
  private readonly evaluators: SAFEEvaluator[] = [];
  private readonly DISAGREEMENT_THRESHOLD = 0.30;

  registrarEvaluador(e: SAFEEvaluator): void {
    this.evaluators.push(e);
  }

  async evaluar(context: SafeEvalContext): Promise<Result<SAFEEvaluation, SafeEvalError>> {
    if (this.evaluators.length === 0) {
      return ok(Object.freeze({ decision: "approved", disagreementPct: 0, details: "no_evaluators" }));
    }

    const results = await Promise.all(this.evaluators.map((e) => e.evaluar(context)));
    const approved = results.filter((r) => r.ok && r.value.approved).length;
    const total = results.length;
    const disagreementPct = total > 0 ? Math.abs(approved - (total - approved)) / total : 0;
    const ensembleAgrees = disagreementPct < this.DISAGREEMENT_THRESHOLD;

    if (!ensembleAgrees) {
      return ok(Object.freeze({
        decision: "blocked",
        disagreementPct,
        details: { approved, total, disagreementPct },
      }));
    }

    const allApproved = approved === total;
    return ok(Object.freeze({
      decision: allApproved ? "approved" : "abstained",
      disagreementPct,
      details: { approved, total },
    }));
  }
}

export interface SAFEEvaluation {
  readonly decision: "approved" | "blocked" | "abstained";
  readonly disagreementPct: number;
  readonly details: Readonly<Record<string, unknown>>;
}

export type SafeEvalError =
  | { readonly kind: "evaluator_failed"; readonly cause: string };

export class SafePostSendHandler {
  private readonly SAMPLE_RATE = 0.10;

  debeEvaluar(interactionCount: number): boolean {
    if (interactionCount <= 0) return false;
    return Math.random() < this.SAMPLE_RATE;
  }

  async muestrear(context: SafeEvalContext, evaluator: SAFEEvaluator): Promise<Result<SafeEvalResult, string>> {
    return evaluator.evaluar(context);
  }
}