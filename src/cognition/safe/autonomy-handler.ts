import { Result, err, ok } from "../../shared/domain/result.ts";
import { AutonomyProgressionState, AutonomyPhase, AUTONOMY_PHASES, avanzarFaseAutonomia, activarKillSwitch } from "./safe-governance.entity.ts";

export class AutonomyProgressionHandler {
  async avanzar(
    progression: AutonomyProgressionState,
    metrics: { wasCorrect: number; indistinguishability: number; csat: number },
  ): Promise<Result<AutonomyPhase, string>> {
    const result = avanzarFaseAutonomia(progression, metrics);
    if (!result.ok) return err(result.error.reason);
    return ok(result.value);
  }

  async killSwitch(reason: string): Promise<AutonomyProgressionState> {
    return activarKillSwitch(reason);
  }

  obtenerDescripcionFase(phase: AutonomyPhase): string {
    const found = AUTONOMY_PHASES.find((p) => p.phase === phase);
    return found?.description ?? "Fase desconocida";
  }
}