/**
 * HUB by Raisen — SLA: Caso de uso para verificar cumplimiento SLA.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { SLAPolicyState, SLAPriority } from "../domain/sla-policy.entity.ts";
import type { BusinessHoursState } from "../domain/business-hours.entity.ts";
import { estaEnHorarioLaboral } from "../domain/business-hours.entity.ts";
import type { SLAPolicyRepository, BusinessHoursRepository } from "../domain/sla.repository.ts";

export interface CheckSLACommand {
  readonly tenantId: TenantId;
  readonly channel: ChannelType;
  readonly elapsedMinutes: number;
  readonly currentDate?: Date;
}

export interface CheckSLAResult {
  readonly breached: boolean;
  readonly policy: SLAPolicyState | null;
  readonly priority: SLAPriority | null;
  readonly reason: string | null;
}

export type CheckSLAError =
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class CheckSLAHandler {
  constructor(
    private readonly slaRepo: SLAPolicyRepository,
    private readonly bhRepo: BusinessHoursRepository,
  ) {}

  async ejecutar(cmd: CheckSLACommand): Promise<Result<CheckSLAResult, CheckSLAError>> {
    const policiesResult = await this.slaRepo.buscarActivas(cmd.tenantId);
    if (!policiesResult.ok) return err({ kind: "persistence_failure", cause: causaDe(policiesResult.error) });

    const policies = policiesResult.value;
    if (policies.length === 0) {
      return ok({ breached: false, policy: null, priority: null, reason: "no_hay_politicas_activas" });
    }

    // Filtrar por canal si la politica tiene canal definido
    const channelPolicies = policies.filter(
      (p) => p.channel === null || p.channel === cmd.channel,
    );
    if (channelPolicies.length === 0) {
      return ok({ breached: false, policy: null, priority: null, reason: "sin_politica_para_canal" });
    }

    // Cargar business hours si alguna politica las referencía
    const bhIds = [...new Set(channelPolicies.map((p) => p.businessHoursId).filter(Boolean))] as string[];
    let businessHours: BusinessHoursState[] = [];

    if (bhIds.length > 0) {
      const bhResult = await this.bhRepo.buscarPorTenant(cmd.tenantId);
      if (bhResult.ok) {
        businessHours = bhResult.value;
      }
    }

    const date = cmd.currentDate ?? new Date();
    const enHorario = bhIds.length === 0 || estaEnHorarioLaboral(businessHours, date);

    // Si no está en horario laboral, no hay breach
    if (!enHorario) {
      return ok({ breached: false, policy: null, priority: null, reason: "fuera_de_horario_laboral" });
    }

    // Ordenar por prioridad (urgent > high > medium > low)
    const sorted = [...channelPolicies].sort(prioridadSort);

    for (const policy of sorted) {
      if (cmd.elapsedMinutes > policy.responseTimeMinutes) {
        const escalation = cmd.elapsedMinutes > policy.escalationAfterMinutes;
        return ok({
          breached: true,
          policy,
          priority: policy.priority,
          reason: escalation
            ? `escalado: ${cmd.elapsedMinutes}min excede ${policy.escalationAfterMinutes}min`
            : `brecha_response: ${cmd.elapsedMinutes}min excede ${policy.responseTimeMinutes}min`,
        });
      }
    }

    return ok({ breached: false, policy: null, priority: null, reason: null });
  }
}

function prioridadSort(a: SLAPolicyState, b: SLAPolicyState): number {
  const orden: Record<SLAPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return (orden[a.priority] ?? 99) - (orden[b.priority] ?? 99);
}

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}