/**
 * HUB by Raisen — Tipos de evaluacion SAFE.
 */

export interface RowSafeEvaluation {
  id: string;
  interaction_id: string;
  decision: "approved" | "blocked" | "abstained";
  disagreement_pct: number | null;
  autonomy_phase: number | null;
  is_kill_switched: boolean | null;
  kill_switch_reason: string | null;
  created_at: string;
  tenant_id: string | null;
}

export type AutonomyPhase = 0 | 1 | 2 | 3 | 4;

export interface SafeStats {
  totalEvaluaciones: number;
  approved: number;
  blocked: number;
  abstained: number;
  disagreementAvgPct: number | null;
  currentPhase: AutonomyPhase;
  isKillSwitched: boolean;
  killSwitchReason: string | null;
  sinDatos: boolean;
}