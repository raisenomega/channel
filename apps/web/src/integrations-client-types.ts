/**
 * HUB by Raisen — Tipos y mapper del cliente de integraciones.
 */
export type IntegrationType =
  | "nucleo" | "omega" | "pos" | "table" | "health" | "home" | "fleet";

export interface IntegrationConfig {
  readonly id: string;
  readonly tenantId: string;
  readonly type: IntegrationType;
  readonly config: Readonly<Record<string, unknown>>;
  readonly isActive: boolean;
  readonly lastSyncAt: string | null;
}

export type IntegrationError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "sin_sesion" }
  | { readonly kind: "sin_tenant" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

interface IntegrationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly type: string;
  readonly config: Record<string, unknown>;
  readonly is_active: boolean;
  readonly last_sync_at: string | null;
}

export const TIPO_INTEGRACION: readonly IntegrationType[] = Object.freeze([
  "nucleo", "omega", "pos", "table", "health", "home", "fleet",
]);

function filaAVista(row: IntegrationRow): IntegrationConfig | null {
  if (!TIPO_INTEGRACION.includes(row.type as IntegrationType)) return null;
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    type: row.type as IntegrationType,
    config: Object.freeze({ ...row.config }),
    isActive: Boolean(row.is_active),
    lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
  };
}

export { filaAVista };
export type { IntegrationRow };