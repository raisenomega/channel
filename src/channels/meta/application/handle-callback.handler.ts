/**
 * HUB by Raisen — HandleCallbackHandler: procesa callback Meta.
 * Valida webhook, state CSRF, maquina de estados, persiste.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { transicionarEstado } from "../domain/embedded-signup.entity.ts";
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import { validarSignupWebhook } from "./signup-validation.ts";
import type { CallbackError, CallbackResult, EmbeddedSignupRepository } from "./embedded-signup.repo.ts";

export type { CallbackError, CallbackResult, EmbeddedSignupRepository };

export interface StateVerifier {
  verificarState(state: string, tenantId: string): Promise<Result<boolean, string>>;
}

export class HandleCallbackHandler {
  constructor(
    private readonly repo: EmbeddedSignupRepository,
    private readonly stateVerifier?: StateVerifier,
  ) {}

  async ejecutar(metaPayload: unknown, state?: string, tenantId?: string): Promise<Result<CallbackResult, CallbackError>> {
    // CRIT-2: Verificar CSRF state si hay verifier configurado
    if (this.stateVerifier && state && tenantId) {
      const sv = await this.stateVerifier.verificarState(state, tenantId);
      if (!sv.ok || !sv.value) return err({ kind: "validacion_fallo", cause: "state_invalido_o_expirado" });
    }

    const validated = validarSignupWebhook(metaPayload);
    if (!validated.ok) return err({ kind: "validacion_fallo", cause: validated.error.kind });
    const metaId = crypto.randomUUID();
    const p = validated.value;

    const existing = await this.repo.buscarPorMetaId(p.id);
    const signupId = existing.ok && existing.value ? existing.value.id : metaId;
    const tenant = existing.ok && existing.value ? existing.value.tenantId : (tenantId ?? "pending");
    if (tenant === "pending") return err({ kind: "validacion_fallo", cause: "signup_no_encontrado" });

    const transicion = existing.ok && existing.value
      ? (existing.value.status === (p.status as EmbeddedSignupStatus)
        ? ok(existing.value.status)
        : transicionarEstado(existing.value.status, p.status as EmbeddedSignupStatus))
      : ok(p.status as EmbeddedSignupStatus);
    if (!transicion.ok) return err({ kind: "validacion_fallo", cause: `transicion_invalida: ${transicion.error.kind}` });

    const updateData: Record<string, unknown> = {
      status: p.status, waba_id: p.waba_id, phone_number_id: p.phone_number_id,
      recipient_phone_number: p.recipient_phone_number, legal_entity_name: p.legal_entity_name,
      meta_business_id: p.business_id, meta_account_id: p.account_id, error_message: null,
    };
    if (p.status === "COMPLETED") updateData.completed_at = new Date().toISOString();
    if (existing.ok && existing.value) {
      const upd = await this.repo.actualizar(signupId, updateData);
      if (!upd.ok) return err({ kind: "persistence_failure", cause: upd.error });
    }
    if (p.access_token) {
      const tok = await this.repo.guardarToken(signupId, tenant, p.access_token, p.access_token_expires_at ?? "");
      if (!tok.ok) return err({ kind: "persistence_failure", cause: tok.error });
    }
    return ok({ signupId, status: transicion.value, wabaId: p.waba_id ?? null, phoneNumberId: p.phone_number_id ?? null });
  }
}