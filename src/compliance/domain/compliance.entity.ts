import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, ContactId } from "../../shared/domain/ids.ts";

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

export const registrarConsent = (
  contactId: ContactId,
  tenantId: TenantId,
  channel: ChannelType,
  action: ConsentAction,
  source: ConsentSource,
): ConsentRecord => Object.freeze({
  id: crypto.randomUUID(),
  tenantId,
  contactId,
  channel,
  action,
  source,
  consentedAt: new Date(),
  expiresAt: action === "opt_in" ? new Date(Date.now() + 365 * 86_400_000) : null,
});

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

export const crearAuditEntry = (
  tenantId: TenantId,
  action: string,
  resource: string,
  actorType: "user" | "ai_agent" | "system" | "integration",
  actorId?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
): AuditEntry => Object.freeze({
  id: crypto.randomUUID(),
  tenantId,
  actorId: actorId ?? null,
  actorType,
  action,
  resource,
  resourceId: resourceId ?? null,
  details: Object.freeze(details ?? {}),
  createdAt: new Date(),
});