import { Result, err, ok } from "../../shared/domain/result.ts";
import { AuditLogId, TenantId } from "../../shared/domain/ids.ts";
import { AuditEntry, AuditAction, AuditActorType, AuditEntryError, esAccionValida } from "./audit-types.ts";

/**
 * Fabrica una entrada de auditoría inmutable. Valida invariantes de dominio
 * (acción y recurso) y devuelve un Result en lugar de lanzar excepciones.
 */
export const crearAuditEntry = (
  tenantId: TenantId,
  action: AuditAction,
  resource: string,
  options: {
    readonly actorType?: AuditActorType;
    readonly actorId?: string | null;
    readonly resourceId?: string | null;
    readonly details?: Readonly<Record<string, unknown>>;
  } = {},
): Result<AuditEntry, AuditEntryError> => {
  if (!esAccionValida(action)) return err({ kind: "accion_invalida" });
  if (!resource.trim()) return err({ kind: "recurso_vacio" });

  return ok(Object.freeze({
    id: crypto.randomUUID() as AuditLogId,
    tenantId,
    actorId: options.actorId ?? null,
    actorType: options.actorType ?? "system",
    action,
    resource,
    resourceId: options.resourceId ?? null,
    details: Object.freeze(options.details ?? {}),
    createdAt: new Date(),
  }));
};