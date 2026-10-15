/**
 * HUB by Raisen — Entidad de dominio: Embedded Signup Meta
 * Estados del flujo de registro embebido de WhatsApp Business Platform.
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";

export type EmbeddedSignupStatus =
  | "CREATED"
  | "ATTEMPTED_REACH"
  | "COMPLETED"
  | "PENDING_DELETE"
  | "DELETED";

export interface EmbeddedSignupState {
  readonly id: string;
  readonly tenantId: string;
  readonly wabaId: string | null;
  readonly phoneNumberId: string | null;
  readonly status: EmbeddedSignupStatus;
  readonly accessToken: string | null;
  readonly accessTokenExpiresAt: string | null;
  readonly recipientPhoneNumber: string | null;
  readonly legalEntityName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly metaBusinessId: string | null;
  readonly metaAccountId: string | null;
  readonly errorMessage: string | null;
}

export const STATUS_TRANSITIONS: Record<EmbeddedSignupStatus, readonly EmbeddedSignupStatus[]> = {
  CREATED:          ["ATTEMPTED_REACH", "COMPLETED"],
  ATTEMPTED_REACH:  ["COMPLETED", "PENDING_DELETE", "CREATED"],
  COMPLETED:        ["PENDING_DELETE"],
  PENDING_DELETE:   ["DELETED", "COMPLETED"],
  DELETED:          [],
};

export type SignupError = { readonly kind: "transicion_invalida"; readonly from: EmbeddedSignupStatus; readonly to: EmbeddedSignupStatus }
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "waba_duplicado" };

export function transicionarEstado(
  current: EmbeddedSignupStatus,
  target: EmbeddedSignupStatus,
): Result<EmbeddedSignupStatus, SignupError> {
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return err({ kind: "transicion_invalida", from: current, to: target });
  }
  return ok(target);
}

export function puedeIniciarSignup(tenantId: string): Result<void, SignupError> {
  if (!tenantId) return err({ kind: "tenant_requerido" });
  return ok(undefined);
}