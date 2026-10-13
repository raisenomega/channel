import { Result, err, ok } from "../../shared/domain/result.ts";
import { AuditLogId, TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry, AuditAction, AuditActorType, esAccionValida } from "../domain/audit-entry.entity.ts";
import { AuditRepository, AuditQuery, RepoError } from "../domain/audit.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

/**
 * Convierte una fila cruda de `audit_logs` a entidad de dominio inmutable.
 * Aísla el mapeo de infraestructura para no filtrar tipos de Supabase al dominio.
 */
const desdeRowAuditLog = (row: Record<string, unknown>): AuditEntry | null => {
  const action = row.action as string;
  if (!esAccionValida(action)) return null;

  return Object.freeze({
    id: row.id as AuditLogId,
    tenantId: row.tenant_id as TenantId,
    actorId: (row.actor_id as string | null) ?? null,
    actorType: (row.actor_type as AuditActorType) ?? "system",
    action: action as AuditAction,
    resource: row.resource as string,
    resourceId: (row.resource_id as string | null) ?? null,
    details: Object.freeze((row.details as Record<string, unknown> | null) ?? {}),
    createdAt: new Date(row.created_at as string),
  });
};

export type AuditLogRow = Record<string, unknown>;

export class AuditRepositorySupabase implements AuditRepository {
  async guardar(entry: AuditEntry): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        tenant_id: entry.tenantId,
        actor_id: entry.actorId,
        actor_type: entry.actorType,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        details: entry.details,
        created_at: entry.createdAt.toISOString(),
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(tenantId: TenantId, query: AuditQuery): Promise<Result<AuditEntry[], RepoError>> {
    try {
      let builder = supabase
        .from("audit_logs")
        .select("*")
        .eq("tenant_id", tenantId);

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