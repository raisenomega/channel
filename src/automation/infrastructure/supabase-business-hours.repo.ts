/**
 * HUB by Raisen — Repositorio Supabase de horarios de negocio.
 * Implementa BusinessHoursRepository. Patron notifications.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { BusinessHoursState } from "../domain/sla-bizhours.entity.ts";
import type { BusinessHoursRepository, RepoError } from "../domain/automation.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface BusinessHoursRow {
  id: string; tenant_id: string; inbox_id: string | null;
  timezone: string; schedule: unknown;
}

function toEntity(r: BusinessHoursRow): BusinessHoursState {
  return {
    id: r.id,
    tenantId: r.tenant_id as TenantId,
    inboxId: r.inbox_id,
    timezone: r.timezone,
    schedule: (r.schedule as Record<string, unknown> | null) ?? {},
  };
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseBusinessHoursRepo implements BusinessHoursRepository {
  async guardar(hours: BusinessHoursState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/business_hours`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: hours.id, tenant_id: hours.tenantId, inbox_id: hours.inboxId, timezone: hours.timezone, schedule: hours.schedule }),
      });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscar(tenantId: TenantId): Promise<Result<BusinessHoursState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/business_hours?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as BusinessHoursRow[];
      return ok(rows.map(toEntity));
    } catch (e) { return err(mapErr(String(e))); }
  }
}