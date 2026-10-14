/**
 * HUB by Raisen — Tipos del cliente de integraciones.
 */

export type IntegrationType =
  | "nucleo" | "omega" | "pos" | "table" | "health" | "home" | "fleet";

export interface Integration {
  readonly id: string;
  readonly tenantId: string;
  readonly type: IntegrationType;
  readonly config: Readonly<Record<string, unknown>>;
  readonly isActive: boolean;
  readonly lastSyncAt: string | null;
}

export type IntegrationError =
  | { kind: "config_incompleta"; cause?: string }
  | { kind: "sin_sesion"; cause?: string }
  | { kind: "no_autorizado"; cause?: string }
  | { kind: "red"; cause?: string };

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface RowIntegration {
  id: string;
  tenant_id: string;
  type: string;
  config: Record<string, unknown> | null;
  is_active: boolean | null;
  last_sync_at: string | null;
}

export const TIPO_INTEGRACION: readonly IntegrationType[] = Object.freeze([
  "nucleo", "omega", "pos", "table", "health", "home", "fleet",
]);