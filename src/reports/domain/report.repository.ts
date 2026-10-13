/**
 * HUB by Raisen — BC reports: contrato de persistencia.
 * El repositorio expone las consultas reales a las tablas origen
 * (conversations, messages, agent_interactions) que alimentan los reportes.
 */
import type { Result } from "../../shared/domain/result.ts";
import type { ReportConfig } from "./report.entity.ts";
import type { RawReportData, ReportResult } from "./report.types.ts";

export interface ReportRepository {
  loadRaw(cfg: ReportConfig): Promise<Result<RawReportData, ReportError>>;
}

export interface ReportAggregator {
  aggregate(data: RawReportData, cfg: ReportConfig): ReportResult;
}

export type ReportError =
  | { readonly kind: "persistence_failure"; readonly cause: string }
  | { readonly kind: "invalid_range" };