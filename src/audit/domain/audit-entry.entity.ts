import { Result, err, ok } from "../../shared/domain/result.ts";
import { AuditLogId, TenantId } from "../../shared/domain/ids.ts";

/** Tipos de actor que puede originar una entrada de auditoria. */
export type AuditActorType = "user" | "ai_agent" | "system" | "integration";

/**
 * Conjunto canónico de acciones auditable. Se modela como unión cerrada para
 * dar trazabilidad tipada; nuevas acciones se agregan aquí de forma explícita.
 */
export type AuditAction =
  | "entity.created"
  | "entity.updated"
  | "entity.deleted"
  | "entity.viewed"
  | "auth.login"
  | "auth.logout"
  | "auth.failed_login"
  | "consent.granted"
  | "consent.revoked"
  | "data.exported"
  | "data.deleted"
  | "data.accessed"
  | "settings.changed"
  | "permission.granted"
  | "permission.revoked"
  | "integration.connected"
  | "integration.disconnected";

/** Estado inmutable de una entrada de auditoría (entidad de lectura). */
export interface AuditEntry {
  readonly id: AuditLogId;
  readonly tenantId: TenantId;
  readonly actorId: string | null;
  readonly actorType: AuditActorType;
  readonly action: AuditAction;
  readonly resource: string;
  readonly resourceId: string | null;
  readonly details: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}

export type AuditEntryError =
  | { readonly kind: "accion_invalida" }
  | { readonly kind: "recurso_vacio" };

const ACCIONES_VALIDAS: readonly AuditAction[] = [
  "entity.created", "entity.updated", "entity.deleted", "entity.viewed",
  "auth.login", "auth.logout", "auth.failed_login",
  "consent.granted", "consent.revoked",
  "data.exported", "data.deleted", "data.accessed",
  "settings.changed",
  "permission.granted", "permission.revoked",
  "integration.connected", "integration.disconnected",
];

/** Validación en runtime: permite garantizar que provenga de la unión cerrada. */
export const esAccionValida = (value: string): value is AuditAction =>
  (ACCIONES_VALIDAS as readonly string[]).includes(value);

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