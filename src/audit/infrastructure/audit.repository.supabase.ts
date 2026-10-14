import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry } from "../domain/audit-entry.entity.ts";
import { AuditRepository, AuditQuery, RepoError } from "../domain/audit.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { desdeRowAuditLog, AuditLogRow } from "./audit-repo-mappers.ts";

export class AuditRepositorySupabase implements AuditRepository {
  async guardar(entry: AuditEntry): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        tenant_id: entry.tenantId, actor_id: entry.actorId, actor_type: entry.actorType,
        action: entry.action, resource: entry.resource, resource_id: entry.resourceId,
        details: entry.details, created_at: entry.createdAt.toISOString(),
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(tenantId: TenantId, query: AuditQuery): Promise<Result<AuditEntry[], RepoError>> {
    try {
      let builder = supabase.from("audit_logs").select("*").eq("tenant_id", tenantId);
      if (query.actorId !== undefined) builder = builder.eq("actor_id", query.actorId);
      if (query.actorType !== undefined) builder = builder.eq("actor_type", query.actorType);
      if (query.action !== undefined) builder = builder.eq("action", query.action);
      if (query.resource !== undefined) builder = builder.eq("resource", query.resource);
      if (query.from !== undefined) builder = builder.gte("created_at", query.from.toISOString());
      if (query.to !== undefined) builder = builder.lte("created_at", query.to.toISOString());
      if (query.cursor !== undefined) builder = builder.lt("created_at", query.cursor);
      builder = builder.order("created_at", { ascending: false });
      if (query.limit !== undefined) builder = builder.limit(query.limit);

      const { data, error } = await builder;
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      const entries = (data ?? [])
        .map((r: AuditLogRow) => desdeRowAuditLog(r))
        .filter((e): e is AuditEntry => e !== null);
      return ok(entries);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}