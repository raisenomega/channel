import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { SLAPolicyState } from "../domain/sla-policy.entity.ts";
import type { SLAPolicyRepository, RepoError } from "../domain/sla.repository.ts";
import { desdeRowSLAPolicy } from "./sla-repo-mappers.ts";

export class SLAPolicyRepositorySupabase implements SLAPolicyRepository {
  async guardar(policy: SLAPolicyState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("sla_policies").upsert({
        id: policy.id, tenant_id: policy.tenantId, name: policy.name, channel: policy.channel,
        priority: policy.priority, response_time_minutes: policy.responseTimeMinutes,
        resolution_time_minutes: policy.resolutionTimeMinutes, escalation_after_minutes: policy.escalationAfterMinutes,
        is_active: policy.isActive, business_hours_id: policy.businessHoursId,
        created_at: policy.createdAt.toISOString(), updated_at: policy.updatedAt.toISOString(),
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
      const { data, error } = await supabase.from("sla_policies").select("*").eq("tenant_id", tenantId).eq("is_active", true);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowSLAPolicy(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorCanal(tenantId: TenantId, channel: ChannelType): Promise<Result<SLAPolicyState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("sla_policies").select("*").eq("tenant_id", tenantId).eq("is_active", true).or(`channel.eq.${channel},channel.is.null`);
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