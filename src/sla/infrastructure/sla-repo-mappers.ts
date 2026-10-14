import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { SLAPolicyState, SLAPriority } from "../domain/sla-policy.entity.ts";
import type { BusinessHoursState, DayOfWeek } from "../domain/business-hours.entity.ts";

export const desdeRowSLAPolicy = (row: Record<string, unknown>): SLAPolicyState =>
  Object.freeze({
    id: row.id as string,
    tenantId: row.tenant_id as TenantId,
    name: row.name as string,
    channel: (row.channel as ChannelType) ?? null,
    priority: (row.priority as SLAPriority) ?? "medium",
    responseTimeMinutes: (row.response_time_minutes as number) ?? 60,
    resolutionTimeMinutes: (row.resolution_time_minutes as number) ?? 240,
    escalationAfterMinutes: (row.escalation_after_minutes as number) ?? 120,
    isActive: (row.is_active as boolean) ?? true,
    businessHoursId: (row.business_hours_id as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });

export const desdeRowBusinessHours = (row: Record<string, unknown>): BusinessHoursState =>
  Object.freeze({
    id: row.id as string,
    tenantId: row.tenant_id as TenantId,
    name: (row.name as string) ?? "",
    dayOfWeek: row.day_of_week as DayOfWeek,
    openTime: row.open_time as string,
    closeTime: row.close_time as string,
    timezone: (row.timezone as string) ?? "UTC",
    isActive: (row.is_active as boolean) ?? true,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });