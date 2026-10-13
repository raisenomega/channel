/**
 * HUB by Raisen — SLA: Value Object de horario laboral (Business Hours).
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=domingo, 6=sabado

export interface BusinessHoursState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly dayOfWeek: DayOfWeek;
  readonly openTime: string; // HH:mm
  readonly closeTime: string; // HH:mm
  readonly timezone: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CreateBusinessHoursError =
  | { readonly kind: "dia_invalido" }
  | { readonly kind: "hora_apertura_invalida" }
  | { readonly kind: "hora_cierre_invalida" }
  | { readonly kind: "apertura_mayor_que_cierre" }
  | { readonly kind: "timezone_vacio" };

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const crearBusinessHours = (
  tenantId: TenantId,
  name: string,
  dayOfWeek: DayOfWeek,
  openTime: string,
  closeTime: string,
  timezone: string = "UTC",
): Result<BusinessHoursState, CreateBusinessHoursError> => {
  if (dayOfWeek < 0 || dayOfWeek > 6) return err({ kind: "dia_invalido" });
  if (!TIME_REGEX.test(openTime)) return err({ kind: "hora_apertura_invalida" });
  if (!TIME_REGEX.test(closeTime)) return err({ kind: "hora_cierre_invalida" });
  if (openTime >= closeTime) return err({ kind: "apertura_mayor_que_cierre" });
  if (!timezone?.trim()) return err({ kind: "timezone_vacio" });

  const now = new Date();
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    name: name.trim(),
    dayOfWeek,
    openTime,
    closeTime,
    timezone: timezone.trim(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
};

export const estaEnHorarioLaboral = (
  businessHours: BusinessHoursState[],
  date: Date = new Date(),
): boolean => {
  const dayOfWeek = date.getDay() as DayOfWeek;
  const timeStr = date.toTimeString().slice(0, 5);

  for (const bh of businessHours) {
    if (!bh.isActive) continue;
    if (bh.dayOfWeek !== dayOfWeek) continue;
    if (timeStr >= bh.openTime && timeStr < bh.closeTime) return true;
  }
  return false;
};