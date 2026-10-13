/**
 * HUB by Raisen — Compliance: tipos puras.
 * Extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { TenantId, ContactId } from "../../shared/domain/ids.ts";

export type ChannelType = "whatsapp" | "email" | "sms" | "phone" | "web";
export type ConsentAction = "opt_in" | "opt_out" | "withdrawn" | "expired";
export type ConsentSource = "explicit" | "implied" | "legal_requirement" | "system";

export interface ConsentRecord {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly channel: ChannelType;
  readonly action: ConsentAction;
  readonly source: ConsentSource;
  readonly consentedAt: Date;
  readonly expiresAt: Date | null;
}

export type ConsentError = { readonly kind: "ya_opt_in" } | { readonly kind: "ya_opt_out" };

export interface PrivacyConfigState {
  readonly tenantId: TenantId;
  readonly privacyPolicyUrl: string | null;
  readonly gdprMode: boolean;
  readonly ccpaMode: boolean;
  readonly aiDisclosure: boolean;
  readonly aiDisclosureText: string;
  readonly dataRetentionDays: number;
  readonly auditRetentionYears: number;
}

export interface AuditEntry {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly actorId: string | null;
  readonly actorType: "user" | "ai_agent" | "system" | "integration";
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string | null;
  readonly details: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}