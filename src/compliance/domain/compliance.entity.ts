import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, ContactId } from "../../shared/domain/ids.ts";
import {
  ChannelType, ConsentAction, ConsentSource, ConsentRecord, ConsentError, AuditEntry,
} from "./compliance.types.ts";

export type {
  ChannelType, ConsentAction, ConsentSource, ConsentRecord, ConsentError, PrivacyConfigState, AuditEntry,
} from "./compliance.types.ts";

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

export const validarTransicionConsent = (prev: ConsentAction, next: ConsentAction): Result<void, ConsentError> => {
  if (prev === "opt_out" && next !== "opt_in") return err({ kind: "ya_opt_out" });
  if (prev === "opt_in" && next === "opt_in") return err({ kind: "ya_opt_in" });
  return ok(undefined);
};