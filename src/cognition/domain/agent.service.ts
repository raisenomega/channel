import { ConversationId, TenantId, ContactId } from "../../shared/domain/ids.ts";
import { ConfidenceVO } from "./confidence.vo.ts";

export type KnowledgeCategory =
  | "rule" | "preference" | "pattern" | "correction" | "context"
  | "brand_voice" | "catalog" | "escalation" | "benchmark";

export type EpisodeType =
  | "initial_contact" | "quote_negotiation" | "order_processing"
  | "complaint_resolution" | "reservation_booking" | "delivery_tracking"
  | "support_ticket" | "upsell_cross_sell" | "churn_prevention"
  | "retention_success" | "onboarding_customer" | "lost_customer"
  | "human_escalation" | "custom";

export type CorrectionCategory =
  | "wrong_information" | "wrong_tone" | "wrong_action" | "wrong_recipient"
  | "wrong_price" | "wrong_timing" | "should_have_escalated" | "other";

export interface AgentInteractionState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly channel: string;
  readonly contactMessage: string | null;
  readonly reasoning: string | null;
  readonly confidencePre: ConfidenceVO | null;
  readonly agentResponse: string | null;
  readonly actionTaken: Readonly<Record<string, unknown>> | null;
  readonly wasCorrect: boolean | null;
  readonly correctionCategory: CorrectionCategory | null;
  readonly model: string;
  readonly costUsd: number;
  readonly createdAt: Date;
}

export interface AgentKnowledgeState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly category: KnowledgeCategory;
  readonly knowledge: string;
  readonly confidence: number;
  readonly timesApplied: number;
  readonly timesConfirmed: number;
  readonly timesCorrected: number;
  readonly status: "active" | "archived" | "superseded" | "deleted";
}