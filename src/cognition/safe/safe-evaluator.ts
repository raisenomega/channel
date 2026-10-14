import { Result, ok } from "../../shared/domain/result.ts";
import { SAFEEvaluator, SafeEvalContext, SafeEvalResult, SAFEEvaluation, SafeEvalError } from "./safe-evaluator.types.ts";

export type { SAFEEvaluator, SafeEvalContext, SafeEvalResult, SAFEEvaluation, SafeEvalError } from "./safe-evaluator.types.ts";

export class SafePreSendHandler {
  private readonly evaluators: SAFEEvaluator[] = [];
  private readonly DISAGREEMENT_THRESHOLD = 0.30;

  registrarEvaluador(e: SAFEEvaluator): void {
    this.evaluators.push(e);
  }

  async evaluar(context: SafeEvalContext): Promise<Result<SAFEEvaluation, SafeEvalError>> {
    if (this.evaluators.length === 0) {
      return ok(Object.freeze({ decision: "approved", disagreementPct: 0, details: { motivo: "no_evaluators" } }));
    }

    const results = await Promise.all(this.evaluators.map((e) => e.evaluar(context)));
    const approved = results.filter((r) => r.ok && r.value.approved).length;
    const rejected = results.length - approved;
    const total = results.length;
    // Desacuerdo = qué tan parejo está el ensemble
    // 0 = unanimidad; 1 = perfectamente dividido
    const disagreementPct = total > 0 ? Math.min(approved, rejected) / (total / 2) : 0;
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