import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export type IntegrationType =
  | "nucleo" | "omega" | "pos" | "table" | "health" | "home" | "fleet" | "safe";

export type SyncDirection = "inbound" | "outbound";
export type SyncStatus = "success" | "failed" | "partial";

export interface IntegrationConfigState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly type: IntegrationType;
  readonly config: Readonly<Record<string, unknown>>;
  readonly isActive: boolean;
  readonly lastSyncAt: Date | null;
}

export interface SyncLogState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly integrationId: string;
  readonly direction: SyncDirection;
  readonly entity: string;
  readonly status: SyncStatus;
  readonly errorMessage: string | null;
  readonly createdAt: Date;
}

export type IntegrationEventType =
  | "nucleo.contact.updated" | "nucleo.invoice.created"
  | "omega.campaign.sent" | "omega.brand_voice.updated"
  | "pos.sale.completed"
  | "table.reservation.updated"
  | "home.maintenance.created"
  | "fleet.delivery.status_changed";

export interface IntegrationEvent {
  readonly type: IntegrationEventType;
  readonly tenantId: TenantId;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface IntegracionRepository {
  guardar(sync: SyncLogState): Promise<Result<void, RepoError>>;
  obtenerConfig(tenantId: TenantId, type: IntegrationType): Promise<Result<IntegrationConfigState | null, RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };