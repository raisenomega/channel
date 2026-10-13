/**
 * HUB by Raisen — BC reports: logica de agregacion. Convierte rows reales de
 * conversations, messages y agent_interactions en metricas. Sin datos mock.
 */
import type { ReportConfig } from "../domain/report.entity.ts";
import type { ReportAggregator } from "../domain/report.repository.ts";
import type { RawReportData, ReportResult, ReportSeriesPoint } from "../domain/report.types.ts";

export class ReportGenerator implements ReportAggregator {
  aggregate(data: RawReportData, cfg: ReportConfig): ReportResult {
    const ai = data.messages.filter((m) => m.senderType === "ai_agent").length;
    const hum = data.messages.filter((m) => m.senderType === "human_agent").length;
    const resolved = data.conversations.filter((c) => c.resolvedAt !== null && c.resolvedAt !== "");
    const delta = resolved.map((c) =>
      new Date(c.resolvedAt as string).getTime() - new Date(c.createdAt).getTime());
    const meanResolve = mean(delta);
    const scored = data.agentInteractions.filter((i) => i.wasCorrect !== null);
    const conf = data.agentInteractions.filter((i) => i.confidencePost !== null);
    return {
      type: cfg.type, from: cfg.from, to: cfg.to,
      totalConversations: data.conversations.length,
      totalMessages: data.messages.length,
      totalAiMessages: ai, totalHumanMessages: hum,
      avgResolveHours: meanResolve === null ? null : meanResolve / 3.6e6,
      aiCorrectRate: scored.length ? scored.filter((i) => i.wasCorrect === true).length / scored.length : null,
      avgAiConfidence: mean(conf.map((c) => c.confidencePost ?? 0)),
      totalAiCostUsd: sum(data.agentInteractions.map((i) => i.costUsd ?? 0)),
      series: series(data, cfg),
    };
  }
}

function mean(v: number[]): number | null {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function sum(v: number[]): number { return v.reduce((a, b) => a + b, 0); }

function series(data: RawReportData, cfg: ReportConfig): ReadonlyArray<ReportSeriesPoint> {
  const buckets = new Map<string, number>();
  for (const c of data.conversations) {
    const k = keyOf(c.createdAt, cfg, data);
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, count]) => ({ key, count }));
}

function keyOf(iso: string, cfg: ReportConfig, data: RawReportData): string {
  const d = new Date(iso);
  if (cfg.groupBy === "week") return isoWeek(d);
  if (cfg.groupBy === "month") return d.toISOString().slice(0, 7);
  if (cfg.groupBy === "day") return d.toISOString().slice(0, 10);
  if (cfg.groupBy === "channel") return topChannel(data);
  return "total";
}

function topChannel(data: RawReportData): string {
  const counts = new Map<string, number>();
  for (const c of data.conversations) counts.set(c.primaryChannel, (counts.get(c.primaryChannel) ?? 0) + 1);
  let top = "unknown"; let n = -1;
  for (const [ch, c] of counts) if (c > n) { n = c; top = ch; }
  return top;
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((date.getTime() - start.getTime()) / 864e5 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}