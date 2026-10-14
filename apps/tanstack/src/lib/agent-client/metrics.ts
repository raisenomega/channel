/**
 * HUB by Raisen — Metricas del agente IA.
 */
import { restGet } from "../supabase";
import type { AgentMetrics } from "../types";
import { toResult, unwrapError, countBy, topKey } from "./helpers";
import type { Result, RawInteraction } from "./types";
import { emptyMetrics } from "./types";

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
      byokConfigured: false,
      fallbackProvider: null,
    };
  });
}