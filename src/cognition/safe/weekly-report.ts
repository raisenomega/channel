export interface WeeklyReport {
  readonly tenantId: string;
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

export class WeeklyReportGenerator {
  async generar(
    tenantId: string,
    metrics: {
      totalInteractions: number;
      autonomousInteractions: number;
      escalatedCount: number;
      wasCorrectRate: number | null;
      indistinguishabilityAvg: number | null;
      totalCostUsd: number;
    },
    incidents: unknown[],
    recommendations: string[],
  ): Promise<WeeklyReport> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return Object.freeze({
      tenantId: tenantId as never,
      weekStart, weekEnd: now,
      totalInteractions: metrics.totalInteractions,
      autonomousInteractions: metrics.autonomousInteractions,
      escalatedCount: metrics.escalatedCount,
      wasCorrectRate: metrics.wasCorrectRate,
      indistinguishabilityAvg: metrics.indistinguishabilityAvg,
      totalCostUsd: metrics.totalCostUsd,
      incidents: Object.freeze(incidents),
      recommendations: Object.freeze(recommendations),
    });
  }
}