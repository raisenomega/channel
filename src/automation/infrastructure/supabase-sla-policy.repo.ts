/**
 * HUB by Raisen — Repositorio Supabase de politicas SLA.
 * Implementa SLAPolicyRepository. Patron notifications.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { SLAPolicyState } from "../domain/sla-bizhours.entity.ts";
import type { SLAPolicyRepository, RepoError } from "../domain/automation.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface SLAPolicyRow {
  id: string; tenant_id: string; name: string;
  first_response_seconds: number; resolution_seconds: number;
  priority: string; is_active: boolean;
}

function toEntity(r: SLAPolicyRow): SLAPolicyState {
  return {
    id: r.id,
    tenantId: r.tenant_id as TenantId,
    name: r.name,
    firstResponseSeconds: r.first_response_seconds,
    resolutionSeconds: r.resolution_seconds,
    priority: r.priority as "low" | "medium" | "high" | "urgent",
    isActive: r.is_active,
  };
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseSLAPolicyRepo implements SLAPolicyRepository {
  async guardar(policy: SLAPolicyState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/sla_policies`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: policy.id, tenant_id: policy.tenantId, name: policy.name, first_response_seconds: policy.firstResponseSeconds, resolution_seconds: policy.resolutionSeconds, priority: policy.priority, is_active: policy.isActive }),
      });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscarActivas(tenantId: TenantId): Promise<Result<SLAPolicyState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/sla_policies?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&is_active=eq.true`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as SLAPolicyRow[];
      return ok(rows.map(toEntity));
    } catch (e) { return err(mapErr(String(e))); }
  }
}