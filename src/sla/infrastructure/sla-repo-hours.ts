import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { BusinessHoursState } from "../domain/business-hours.entity.ts";
import type { BusinessHoursRepository, RepoError } from "../domain/sla.repository.ts";
import { desdeRowBusinessHours } from "./sla-repo-mappers.ts";

export class BusinessHoursRepositorySupabase implements BusinessHoursRepository {
  async guardar(hours: BusinessHoursState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("business_hours").upsert({
        id: hours.id, tenant_id: hours.tenantId, name: hours.name, day_of_week: hours.dayOfWeek,
        open_time: hours.openTime, close_time: hours.closeTime, timezone: hours.timezone,
        is_active: hours.isActive,
        created_at: hours.createdAt.toISOString(), updated_at: hours.updatedAt.toISOString(),
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
      const { data, error } = await supabase.from("business_hours").select("*").eq("tenant_id", tenantId).eq("is_active", true);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowBusinessHours(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorDia(tenantId: TenantId, dayOfWeek: number): Promise<Result<BusinessHoursState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("business_hours").select("*").eq("tenant_id", tenantId).eq("day_of_week", dayOfWeek).eq("is_active", true);
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