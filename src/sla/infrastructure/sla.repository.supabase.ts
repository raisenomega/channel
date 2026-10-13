/**
 * HUB by Raisen — SLA: Implementación Supabase de repositorios SLA.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { SLAPolicyState, SLAPriority } from "../domain/sla-policy.entity.ts";
import type { BusinessHoursState, DayOfWeek } from "../domain/business-hours.entity.ts";
import type { SLAPolicyRepository, BusinessHoursRepository, RepoError } from "../domain/sla.repository.ts";

// ─── SLAPolicyRepository ───────────────────────────────────────────

export class SLAPolicyRepositorySupabase implements SLAPolicyRepository {
  async guardar(policy: SLAPolicyState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("sla_policies").upsert({
        id: policy.id,
        tenant_id: policy.tenantId,
        name: policy.name,
        channel: policy.channel,
        priority: policy.priority,
        response_time_minutes: policy.responseTimeMinutes,
        resolution_time_minutes: policy.resolutionTimeMinutes,
        escalation_after_minutes: policy.escalationAfterMinutes,
        is_active: policy.isActive,
        business_hours_id: policy.businessHoursId,
        created_at: policy.createdAt.toISOString(),
        updated_at: policy.updatedAt.toISOString(),
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: string): Promise<Result<SLAPolicyState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("sla_policies").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowSLAPolicy(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarActivas(tenantId: TenantId): Promise<Result<SLAPolicyState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("sla_policies").select("*")
        .eq("tenant_id", tenantId).eq("is_active", true);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowSLAPolicy(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorCanal(tenantId: TenantId, channel: ChannelType): Promise<Result<SLAPolicyState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("sla_policies").select("*")
        .eq("tenant_id", tenantId).eq("is_active", true)
        .or(`channel.eq.${channel},channel.is.null`);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowSLAPolicy(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async eliminar(id: string): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("sla_policies").delete().eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}

// ─── BusinessHoursRepository ───────────────────────────────────────

export class BusinessHoursRepositorySupabase implements BusinessHoursRepository {
  async guardar(hours: BusinessHoursState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("business_hours").upsert({
        id: hours.id,
        tenant_id: hours.tenantId,
        name: hours.name,
        day_of_week: hours.dayOfWeek,
        open_time: hours.openTime,
        close_time: hours.closeTime,
        timezone: hours.timezone,
        is_active: hours.isActive,
        created_at: hours.createdAt.toISOString(),
        updated_at: hours.updatedAt.toISOString(),
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: string): Promise<Result<BusinessHoursState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("business_hours").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowBusinessHours(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<BusinessHoursState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("business_hours").select("*")
        .eq("tenant_id", tenantId).eq("is_active", true);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowBusinessHours(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorDia(tenantId: TenantId, dayOfWeek: number): Promise<Result<BusinessHoursState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("business_hours").select("*")
        .eq("tenant_id", tenantId).eq("day_of_week", dayOfWeek).eq("is_active", true);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowBusinessHours(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async eliminar(id: string): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("business_hours").delete().eq("id", id);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}

// ─── Mappers ────────────────────────────────────────────────────────

const desdeRowSLAPolicy = (row: Record<string, unknown>): SLAPolicyState =>
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

const desdeRowBusinessHours = (row: Record<string, unknown>): BusinessHoursState =>
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