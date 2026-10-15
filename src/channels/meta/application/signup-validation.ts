/**
 * HUB by Raisen — Validador del webhook Embedded Signup de Meta.
 * Separado del handler para mantener DDD limpio y testabilidad.
 * Valida propiedades del payload del webhook Meta (signup flow).
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";

export interface SignupWebhookPayload {
  readonly id: string;
  readonly waba_id?: string;
  readonly phone_number_id?: string;
  readonly status: string;
  readonly recipient_phone_number?: string;
  readonly legal_entity_name?: string;
  readonly access_token?: string;
  readonly access_token_expires_at?: string;
  readonly business_id?: string;
  readonly account_id?: string;
}

export type ValidationError =
  | { readonly kind: "id_vacio" }
  | { readonly kind: "status_invalido" }
  | { readonly kind: "token_incompleto" }
  | { readonly kind: "waba_sin_phone" };

const VALID_STATUSES = ["CREATED", "ATTEMPTED_REACH", "COMPLETED", "PENDING_DELETE", "DELETED"];

export function validarSignupWebhook(payload: unknown): Result<SignupWebhookPayload, ValidationError> {
  const p = payload as Record<string, unknown> | null;
  if (!p || typeof p.id !== "string" || !p.id.trim()) {
    return err({ kind: "id_vacio" });
  }

  const status = String(p.status ?? "");
  if (!VALID_STATUSES.includes(status)) {
    return err({ kind: "status_invalido" });
  }

  const result = {
    id: p.id.trim(),
    waba_id: p.waba_id ? String(p.waba_id) : undefined,
    phone_number_id: p.phone_number_id ? String(p.phone_number_id) : undefined,
    status,
    recipient_phone_number: p.recipient_phone_number ? String(p.recipient_phone_number) : undefined,
    legal_entity_name: p.legal_entity_name ? String(p.legal_entity_name) : undefined,
    access_token: p.access_token ? String(p.access_token) : undefined,
    access_token_expires_at: p.access_token_expires_at ? String(p.access_token_expires_at) : undefined,
    business_id: p.business_id ? String(p.business_id) : undefined,
    account_id: p.account_id ? String(p.account_id) : undefined,
  } as SignupWebhookPayload;

  // Si status es COMPLETED, debe tener waba_id + phone_number_id + token
  if (status === "COMPLETED") {
    if (!result.waba_id || !result.phone_number_id) {
      return err({ kind: "waba_sin_phone" });
    }
    if (!result.access_token) {
      return err({ kind: "token_incompleto" });
    }
  }

  return ok(result);
}