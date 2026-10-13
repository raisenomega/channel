/**
 * HUB by Raisen — BC reports: caso de uso de generacion de reportes.
 * Orquesta: carga de datos crudos reales (repositorio) + agregacion (servicio).
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { ReportConfig } from "../domain/report.entity.ts";
import type {
  ReportRepository,
  ReportAggregator,
  ReportError,
} from "../domain/report.repository.ts";
import type { ReportResult } from "../domain/report.types.ts";

export interface GenerateReportCommand {
  readonly config: ReportConfig;
}

export type GenerateReportError = ReportError | { readonly kind: "empty_scope" };

export class GenerateReportHandler {
  constructor(
    private readonly repo: ReportRepository,
    private readonly aggregator: ReportAggregator,
  ) {}

  async ejecutar(cmd: GenerateReportCommand): Promise<Result<ReportResult, GenerateReportError>> {
    const cfg = cmd.config;
    if (cfg.to.getTime() <= cfg.from.getTime()) return err({ kind: "invalid_range" });

    const load = await this.repo.loadRaw(cfg);
    if (!load.ok) return err({ kind: "persistence_failure", cause: causaDe(load.error) });

    if (load.value.conversations.length === 0 && load.value.messages.length === 0) {
      return err({ kind: "empty_scope" });
    }

    return ok(this.aggregator.aggregate(load.value, cfg));
  }
}

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}