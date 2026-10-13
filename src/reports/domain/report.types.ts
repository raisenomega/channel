/**
 * HUB by Raisen — BC reports: tipos compartidos de datos crudos y resultados.
 * Tipos puros extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ReportConfig } from "./report.entity.ts";

export type MessageRow = {
  readonly id: string;
  readonly conversationId: ConversationId;
  readonly tenantId: TenantId;
  readonly direction: "inbound" | "outbound" | "internal";
  readonly senderType: "contact" | "human_agent" | "ai_agent" | "system";
  readonly channel: string;
  readonly status: string;
  readonly aiConfidence: number | null;
  readonly aiMode: string | null;
  readonly createdAt: Date;
};

export type AgentInteractionRow = {
  readonly id: string;
  readonly conversationId: ConversationId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly channel: string;
  readonly wasCorrect: boolean | null;
  readonly confidencePost: number | null;
  readonly latencyMs: number | null;
  readonly tokensInput: number | null;
  readonly tokensOutput: number | null;
  readonly costUsd: number | null;
  readonly createdAt: Date;
};

export type ConversationRowForReport = {
  readonly id: string;
  readonly primaryChannel: string;
  readonly status: string;
  readonly operationMode: string;
  readonly aiMessages: number;
  readonly humanMessages: number;
  readonly slaViolated: boolean;
  readonly resolvedAt: string | null;
  readonly createdAt: string;
};

export interface RawReportData {
  readonly conversations: readonly ConversationRowForReport[];
  readonly messages: readonly MessageRow[];
  readonly agentInteractions: readonly AgentInteractionRow[];
}

export type ReportSeriesPoint = {
  readonly key: string;
  readonly count: number;
};

export interface ReportResult {
  readonly type: string;
  readonly from: Date;
  readonly to: Date;
  readonly totalConversations: number;
  readonly totalMessages: number;
  readonly totalAiMessages: number;
  readonly totalHumanMessages: number;
  readonly avgResolveHours: number | null;
  readonly aiCorrectRate: number | null;
  readonly avgAiConfidence: number | null;
  readonly totalAiCostUsd: number;
  readonly series: readonly ReportSeriesPoint[];
}

export type { ReportConfig };