import { TenantId } from "../../shared/domain/ids.ts";

export interface SLAPolicyState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly firstResponseSeconds: number;
  readonly resolutionSeconds: number;
  readonly priority: "low" | "medium" | "high" | "urgent";
  readonly isActive: boolean;
}

export interface BusinessHoursState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly inboxId: string | null;
  readonly timezone: string;
  readonly schedule: Readonly<Record<string, unknown>>;
}

export interface CannedResponseState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly shortcode: string;
  readonly content: string;
  readonly category: string;
}