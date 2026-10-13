/**
 * HUB by Raisen — SLA: Aggregate root de política SLA.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

export type SLAPriority = "low" | "medium" | "high" | "urgent";

export interface SLAPolicyState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly channel: ChannelType | null;
  readonly priority: SLAPriority;
  readonly responseTimeMinutes: number;
  readonly resolutionTimeMinutes: number;
  readonly escalationAfterMinutes: number;
  readonly isActive: boolean;
  readonly businessHoursId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CreateSLAPolicyError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "response_time_invalido" }
  | { readonly kind: "resolution_time_invalido" }
  | { readonly kind: "escalation_time_invalido" };

export type SLAPolicyError =
  | { readonly kind: "no_activa" }
  | { readonly kind: "tiempo_excedido" };

export const crearSLAPolicy = (
  tenantId: TenantId,
  name: string,
  channel: ChannelType | null,
  priority: SLAPriority,
  responseTimeMinutes: number,
  resolutionTimeMinutes: number,
  escalationAfterMinutes: number,
  businessHoursId: string | null = null,
): Result<SLAPolicyState, CreateSLAPolicyError> => {
  if (!name?.trim()) return err({ kind: "nombre_vacio" });
  if (responseTimeMinutes <= 0) return err({ kind: "response_time_invalido" });
  if (resolutionTimeMinutes <= 0) return err({ kind: "resolution_time_invalido" });
  if (escalationAfterMinutes <= 0) return err({ kind: "escalation_time_invalido" });

  const now = new Date();
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    name: name.trim(),
    channel,
    priority,
    responseTimeMinutes,
    resolutionTimeMinutes,
    escalationAfterMinutes,
    isActive: true,
    businessHoursId,
    createdAt: now,
    updatedAt: now,
  }));
};

export const desactivarSLAPolicy = (
  policy: SLAPolicyState,
): Result<SLAPolicyState, SLAPolicyError> => {
  if (!policy.isActive) return err({ kind: "no_activa" });
  return ok(Object.freeze({ ...policy, isActive: false, updatedAt: new Date() }));
};