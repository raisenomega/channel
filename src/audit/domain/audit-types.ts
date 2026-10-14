import { AuditLogId, TenantId } from "../../shared/domain/ids.ts";

/** Tipos de actor que puede originar una entrada de auditoria. */
export type AuditActorType = "user" | "ai_agent" | "system" | "integration";

/**
 * Conjunto canónico de acciones auditable. Unión cerrada para trazabilidad tipada.
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

/** Validación en runtime de la unión cerrada. */
export const esAccionValida = (value: string): value is AuditAction =>
  (ACCIONES_VALIDAS as readonly string[]).includes(value);