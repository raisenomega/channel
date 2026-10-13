/**
 * HUB by Raisen — Cliente para métricas del agente IA.
 * Consultas reales a Supabase REST (agent_interactions, safe_evaluations).
 */
import type { AgentMetrics, SafeStats } from "./types";
import { restGet } from "./supabase";

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function toResult<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  return fn().then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error: error instanceof Error ? error : new Error(String(error)) }),
  );
}

function unwrapError<T>(res: import("./supabase").RestRes<T>): Error {
  // After !res.ok, TS knows it's RestError
  const err = res as Extract<import("./supabase").RestRes<T>, { ok: false }>;
  if (err.kind === "config_incompleta") {
    return new Error("Supabase no configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
  return new Error(err.cause ?? `Error Supabase: ${err.kind}`);
}

// ── Tipos crudos de Supabase ────────────────────────────────

interface RawInteraction {
  id: string;
  was_correct: boolean | null;
  was_distinguishable: boolean | null;
  resolved_autonomously: boolean | null;
  latency_seconds: number | null;
  provider: string | null;
  model: string | null;
  tenant_id: string | null;
}

interface RawSafeRow {
  id: string;
  decision: string;
  disagreement_pct: number | null;
  autonomy_phase: number | null;
  is_kill_switched: boolean | null;
  kill_switch_reason: string | null;
}

/**
 * Obtiene métricas agregadas del agente IA desde agent_interactions.
 * Calcula promedios de was_correct, was_distinguishable, resolved_autonomously,
 * latencia media, y el proveedor/modelo más frecuente.
 */
export async function getMetrics(): Promise<Result<AgentMetrics, Error>> {
  return toResult(async () => {
    const res = await restGet<RawInteraction>("agent_interactions");
    if (!res.ok) {
      throw unwrapError(res);
    }

    const rows = res.value;
    if (!rows || rows.length === 0) {
      return emptyMetrics();
    }

    const total = rows.length;
    const correctos = rows.filter((r) => r.was_correct === true).length;
    const indistintos = rows.filter((r) => r.was_distinguishable === false).length;
    const autonomos = rows.filter((r) => r.resolved_autonomously === true).length;
    const latencias = rows
      .map((r) => r.latency_seconds)
      .filter((v): v is number => v !== null);

    const wasCorrectPct = total > 0 ? (correctos / total) * 100 : null;
    const indistinguishabilityPct = total > 0 ? (indistintos / total) * 100 : null;
    const autoResolvePct = total > 0 ? (autonomos / total) * 100 : null;
    const avgLatencyMs =
      latencias.length > 0
        ? (latencias.reduce((a, b) => a + b, 0) / latencias.length) * 1000
        : null;

    // Proveedor/modelo más frecuente
    const providerCounts = countBy(rows, "provider");
    const modelCounts = countBy(rows, "model");
    const providerName = topKey(providerCounts) ?? "—";
    const modelName = topKey(modelCounts) ?? "—";

    return {
      wasCorrectPct,
      indistinguishabilityPct,
      autoResolvePct,
      avgLatencyMs,
      totalInteractions: total,
      providerName,
      modelName,
      byokConfigured: false, // Se infiere de otra fuente; por ahora false
      fallbackProvider: null,
    };
  });
}

/**
 * Obtiene estadísticas del panel SAFE desde safe_evaluations.
 */
export async function getSafeStats(): Promise<Result<SafeStats, Error>> {
  return toResult(async () => {
    const res = await restGet<RawSafeRow>("safe_evaluations");
    if (!res.ok) {
      throw unwrapError(res);
    }

    const rows = res.value;
    if (!rows || rows.length === 0) {
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

    const total = rows.length;
    const approved = rows.filter((r) => r.decision === "approved").length;
    const blocked = rows.filter((r) => r.decision === "blocked").length;
    const abstained = rows.filter((r) => r.decision === "abstained").length;

    const disagreements = rows
      .map((r) => r.disagreement_pct)
      .filter((v): v is number => v !== null);
    const disagreementAvgPct =
      disagreements.length > 0
        ? disagreements.reduce((a, b) => a + b, 0) / disagreements.length
        : null;

    // Fase de autonomía más reciente
    const fases = rows
      .map((r) => r.autonomy_phase)
      .filter((v): v is number => v !== null)
      .sort((a, b) => b - a);
    const currentPhase = (fases.length > 0 ? fases[0] : 0) as 0 | 1 | 2 | 3 | 4;

    const killSwitched = rows.find((r) => r.is_kill_switched === true);
    const isKillSwitched = !!killSwitched;
    const killSwitchReason = killSwitched?.kill_switch_reason ?? null;

    return {
      totalEvaluaciones: total,
      approved,
      blocked,
      abstained,
      disagreementAvgPct,
      currentPhase,
      isKillSwitched,
      killSwitchReason,
      sinDatos: false,
    };
  });
}

// ── Helpers ─────────────────────────────────────────────────

function countBy<T>(rows: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[key];
    if (val !== null && val !== undefined) {
      const k = String(val);
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

function topKey(counts: Record<string, number>): string | null {
  let top: string | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      top = k;
    }
  }
  return top;
}

function emptyMetrics(): AgentMetrics {
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