/**
 * HUB by Raisen — Entidades del BC de auditoría (barrel).
 * Tipos y fábrica en submódulos (C4 ≤75).
 */
export {
  esAccionValida,
  type AuditActorType,
  type AuditAction,
  type AuditEntry,
  type AuditEntryError,
} from "./audit-types.ts";
export { crearAuditEntry } from "./audit-factory.ts";