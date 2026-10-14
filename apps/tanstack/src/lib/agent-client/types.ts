/**
 * HUB by Raisen — Tipos del cliente de agente.
 */
import type { AgentMetrics, SafeStats } from "../types";

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function emptyMetrics(): AgentMetrics {
  return {
    wasCorrectPct: null,
    indistinguishabilityPct: null,
    autoResolvePct: null,
    avgLatencyMs: null,
    totalInteractions: 0,
    providerName: "—",
    modelName: "—",
    byokConfigured: false,
    fallbackProvider: null,
  };
}

export function emptySafeStats(): SafeStats {
  return {
    totalEvaluaciones: 0,
    approved: 0,
    blocked: 0,
    abstained: 0,
    disagreementAvgPct: null,
    currentPhase: 0,
    isKillSwitched: false,
    killSwitchReason: null,
    sinDatos: true,
  };
}

export interface RawInteraction {
  id: string;
  was_correct: boolean | null;
  was_distinguishable: boolean | null;
  resolved_autonomously: boolean | null;
  latency_seconds: number | null;
  provider: string | null;
  model: string | null;
  tenant_id: string | null;
}

export interface RawSafeRow {
  id: string;
  decision: string;
  disagreement_pct: number | null;
  autonomy_phase: number | null;
  is_kill_switched: boolean | null;
  kill_switch_reason: string | null;
}