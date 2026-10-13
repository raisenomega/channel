import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export type SchedulerJobTipo =
  | "recalculate_sla"
  | "cleanup_stale_conversations"
  | "sync_integrations"
  | "audit_retention"
  | "weekly_report";

export interface SchedulerJobState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly tipo: SchedulerJobTipo;
  readonly cadenciaCron: string;
  readonly cadenciaMs: number;
  readonly habilitado: boolean;
  readonly ultimaEjecucion: number;
  readonly proximaEjecucion: number;
}

export type SchedulerJobError =
  | { readonly kind: "tenant_invalido" }
  | { readonly kind: "tipo_invalido" }
  | { readonly kind: "cadencia_cron_invalida" }
  | { readonly kind: "cadencia_invalida" };

const TIPOS: readonly SchedulerJobTipo[] = [
  "recalculate_sla",
  "cleanup_stale_conversations",
  "sync_integrations",
  "audit_retention",
  "weekly_report",
];

/**
 * Calcula la proxima ejecucion de un job a partir del momento actual
 * y la cadencia en milisegundos. Funcion pura sin efectos.
 */
export const calcularProximaEjecucion = (ahoraMs: number, cadenciaMs: number): number =>
  ahoraMs + cadenciaMs;

export const crearSchedulerJob = (
  tenantId: TenantId,
  tipo: SchedulerJobTipo,
  cadenciaCron: string,
  cadenciaMs: number,
): Result<SchedulerJobState, SchedulerJobError> => {
  if (!tenantId || tenantId.trim().length === 0) return err({ kind: "tenant_invalido" });
  if (!TIPOS.includes(tipo)) return err({ kind: "tipo_invalido" });
  if (!cadenciaCron || cadenciaCron.trim().length === 0) {
    return err({ kind: "cadencia_cron_invalida" });
  }
  if (!Number.isFinite(cadenciaMs) || cadenciaMs <= 0) return err({ kind: "cadencia_invalida" });

  const ahora = Date.now();

  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    tipo,
    cadenciaCron: cadenciaCron.trim(),
    cadenciaMs,
    habilitado: true,
    ultimaEjecucion: 0,
    proximaEjecucion: calcularProximaEjecucion(ahora, cadenciaMs),
  }));
};