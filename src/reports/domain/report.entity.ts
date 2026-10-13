/**
 * HUB by Raisen — BC reports: tipos puras de reportes y analiticas.
 * Sin datos mock: los reportes se generan desde queries reales a la DB.
 */
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType, OperationMode } from "../../shared/domain/types.ts";

export type ReportId = string & { readonly __brand: "ReportId" };

export type ReportType =
  | "volume_by_day"
  | "volume_by_channel"
  | "ai_vs_human_ratio"
  | "resolve_time"
  | "ai_performance"
  | "operator_performance";

export type ReportGroupBy = "day" | "week" | "month" | "channel" | "status";

export interface ReportConfig {
  readonly tenantId: TenantId;
  readonly type: ReportType;
  readonly from: Date;
  readonly to: Date;
  readonly groupBy: ReportGroupBy;
  readonly channel?: ChannelType;
}

export interface ReportSchedule {
  readonly id: ReportId;
  readonly tenantId: TenantId;
  readonly type: ReportType;
  readonly groupBy: ReportGroupBy;
  readonly cron: string;
  readonly active: boolean;
}

export type ConversationRow = {
  readonly id: ConversationId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly primaryChannel: ChannelType;
  readonly status: string;
  readonly operationMode: OperationMode;
  readonly aiMessages: number;
  readonly humanMessages: number;
  readonly slaViolated: boolean;
  readonly resolvedAt: Date | null;
  readonly createdAt: Date;
};