import { AuditLogId, TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry, AuditAction, AuditActorType, esAccionValida } from "../domain/audit-entry.entity.ts";

/**
 * Convierte una fila cruda de `audit_logs` a entidad de dominio inmutable.
 * Aísla el mapeo de infraestructura para no filtrar tipos de Supabase al dominio.
 */
export const desdeRowAuditLog = (row: Record<string, unknown>): AuditEntry | null => {
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