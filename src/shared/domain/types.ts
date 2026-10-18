export type ChannelType =
  | "whatsapp" | "email" | "instagram" | "facebook"
  | "telegram" | "sms" | "x" | "linkedin" | "webchat";

export type ConversationStatus =
  | "open" | "pending" | "snoozed" | "resolved" | "archived";

export type OperationMode =
  | "human" | "assistant" | "copilot" | "autonomous" | "escalated";

export type MessageDirection = "inbound" | "outbound" | "internal";

export type SenderType = "contact" | "human_agent" | "ai_agent" | "system";

export type Role =
  | "owner" | "admin" | "supervisor" | "agent" | "viewer" | "superadmin"
  | "buyer"; // M-7: C2C sin tenant (Sprint 5 marketplace). SUPERSET, no reemplaza.

export type TenantPlan =
  | "lite_starter" | "lite_pro" | "lite_business"
  | "ecosystem" | "enterprise" | "inbox_addon";

export type Confidence_0_1 = number; // branded type: 0..1