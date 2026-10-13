/**
 * HUB by Raisen — SAFE governance: tipos y datos puras.
 * Extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { TenantId } from "../../shared/domain/ids.ts";

export type EvalType = "pre_send" | "post_send" | "scheduled";
export type EvalStatus = "pending" | "approved" | "blocked" | "abstained";
export type FinalDecision = "approved" | "blocked" | "abstained";

export interface SAFEEvaluationState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly interactionId: string | null;
  readonly evalType: EvalType;
  readonly status: EvalStatus;
  readonly ensembleResults: Readonly<Record<string, unknown>>;
  readonly disagreementPct: number;
  readonly finalDecision: FinalDecision | null;
  readonly metrics: Readonly<Record<string, unknown>>;
  readonly evaluatedAt: Date;
}

export type AutonomyPhase = 0 | 1 | 2 | 3 | 4;

export const AUTONOMY_PHASES: readonly { phase: AutonomyPhase; description: string }[] = Object.freeze([
  { phase: 0, description: "Manual puro (IA solo sugiere)" },
  { phase: 1, description: "Autonomia solo fuera de horario laboral" },
  { phase: 2, description: "Autonomia en horario para consultas frecuentes (con supervision)" },
  { phase: 3, description: "Autonomia en horario para cotizaciones/ordenes < umbral" },
  { phase: 4, description: "Autonomia completa con escalamiento inteligente" },
]);

export interface AutonomyProgressionState {
  readonly tenantId: TenantId;
  readonly currentPhase: AutonomyPhase;
  readonly wasCorrectThreshold: number;
  readonly indistinguishabilityThreshold: number;
  readonly isKillSwitched: boolean;
  readonly killSwitchReason: string | null;
}

export type ProgressionError = { readonly kind: "threshold_not_met"; readonly reason: string }
  | { readonly kind: "kill_switch_active" }
  | { readonly kind: "fase_invalida" };

export interface WeeklyReportState {
  readonly tenantId: TenantId;
  readonly weekStart: Date;
  readonly weekEnd: Date;
  readonly totalInteractions: number;
  readonly autonomousInteractions: number;
  readonly escalatedCount: number;
  readonly wasCorrectRate: number | null;
  readonly indistinguishabilityAvg: number | null;
  readonly totalCostUsd: number;
  readonly incidents: readonly unknown[];
  readonly recommendations: readonly string[];
}