import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry } from "../domain/compliance.entity.ts";
import { AuditRepository, AuditQuery, RepoError } from "../domain/compliance.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class AuditRepositorySupabase implements AuditRepository {
  async guardar(entry: AuditEntry): Promise<Result<void, RepoError>> {
    const { error } = await supabase.from("audit_logs").insert({
      tenant_id: entry.tenantId, actor_id: entry.actorId, actor_type: entry.actorType,
      action: entry.action, resource: entry.resource, resource_id: entry.resourceId,
      details: entry.details, created_at: entry.createdAt.toISOString(),
    });
    return error ? err({ kind: "persistence_failure", cause: error.message }) : ok(undefined);
  }

  async buscar(tenantId: TenantId, q: AuditQuery): Promise<Result<AuditEntry[], RepoError>> {
    let query = supabase.from("audit_logs").select("*").eq("tenant_id", tenantId);
    if (q.action) query = query.eq("action", q.action);
    if (q.resource) query = query.eq("resource", q.resource);
    if (q.actorId) query = query.eq("actor_id", q.actorId);
    if (q.from) query = query.gte("created_at", q.from.toISOString());
    if (q.to) query = query.lte("created_at", q.to.toISOString());
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    if (error) return err({ kind: "persistence_failure", cause: error.message });
    const rows: AuditEntry[] = (data ?? []).map((r) => Object.freeze({
      id: String(r.id), tenantId, actorId: r.actor_id ?? null,
      actorType: r.actor_type, action: r.action, resource: r.resource,
      resourceId: r.resource_id ?? null, details: r.details ?? {}, createdAt: new Date(r.created_at),
    }));
    return ok(rows);
  }
}