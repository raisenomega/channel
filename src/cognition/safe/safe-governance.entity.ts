import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  AutonomyPhase, AutonomyProgressionState, ProgressionError,
} from "./safe-governance.types.ts";

export type {
  EvalType, EvalStatus, FinalDecision, SAFEEvaluationState, AutonomyPhase,
  AutonomyProgressionState, ProgressionError, WeeklyReportState,
} from "./safe-governance.types.ts";
export { AUTONOMY_PHASES } from "./safe-governance.types.ts";

export const avanzarFaseAutonomia = (
  progression: AutonomyProgressionState,
  currentMetrics: { wasCorrect: number; indistinguishability: number },
): Result<AutonomyPhase, ProgressionError> => {
  if (progression.isKillSwitched) return err({ kind: "kill_switch_active" });
  const nextPhase = (progression.currentPhase + 1) as AutonomyPhase;
  if (progression.currentPhase + 1 > 4) return err({ kind: "fase_invalida" });

  if (nextPhase >= 1 && currentMetrics.wasCorrect < progression.wasCorrectThreshold) {
    return err({ kind: "threshold_not_met", reason: `was_correct ${currentMetrics.wasCorrect}% < ${progression.wasCorrectThreshold * 100}%` });
  }
  if (nextPhase >= 2 && currentMetrics.indistinguishability < progression.indistinguishabilityThreshold) {
    return err({ kind: "threshold_not_met", reason: `indistinguishability ${currentMetrics.indistinguishability}% < ${progression.indistinguishabilityThreshold * 100}%` });
  }

  return ok(nextPhase);
};

export const activarKillSwitch = (reason: string): AutonomyProgressionState => Object.freeze({
  tenantId: "kill-switch" as TenantId,
  currentPhase: 0,
  wasCorrectThreshold: 0,
  indistinguishabilityThreshold: 0,
  isKillSwitched: true,
  killSwitchReason: reason,
});