/**
 * HUB by Raisen — Calculo puro de metricas del agente (BC cognition).
 * Recibe filas reales de la DB y devuelve agregados sin inventar datos (N5).
 */
import type { AgentMetricsData } from "./agent-metrics-client.ts";

export function calcularInteracciones(filas: readonly Record<string, unknown>[]): Omit<AgentMetricsData, "autonomousRate"> {
  let correctas = 0;
  let correctasBase = 0;
  let indistSum = 0;
  let indistBase = 0;
  let latSum = 0;
  let latBase = 0;
  for (const r of filas) {
    if (typeof r.was_correct === "boolean") {
      correctasBase += 1;
      if (r.was_correct) correctas += 1;
    }
    const indist = num(r.indistinguishability_score);
    if (indist !== null) { indistSum += indist; indistBase += 1; }
    const lat = num(r.latency_ms);
    if (lat !== null) { latSum += lat; latBase += 1; }
  }
  return Object.freeze({
    totalInteractions: filas.length,
    wasCorrectRate: correctasBase ? pct(correctas, correctasBase) : null,
    indistinguishability: indistBase ? pct(indistSum, indistBase) : null,
    avgLatencyMs: latBase ? Math.round(latSum / latBase) : null,
  });
}

export function calcularAutonomia(filas: readonly Record<string, unknown>[]): number | null {
  if (filas.length === 0) return null;
  const autonomas = filas.filter((r) => r.was_autonomous === true).length;
  return pct(autonomas, filas.length);
}

function pct(parte: number, total: number): number {
  return Math.round((parte / total) * 100);
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}