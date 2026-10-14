/**
 * HUB by Raisen — HandleCallbackHandler: procesa el callback de Meta
 * después del flujo Embedded Signup. Recibe el payload, valida, persiste.
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { transicionarEstado } from "../domain/embedded-signup.entity.ts";
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import { validarSignupWebhook } from "./signup-validation.ts";

export type CallbackError =
  | { readonly kind: "validacion_fallo"; readonly cause: string }
  | { readonly kind: "persistence_failure"; readonly cause: string }
  | { readonly kind: "signup_no_encontrado" };

export interface CallbackResult {
  readonly signupId: string;
  readonly status: EmbeddedSignupStatus;
  readonly wabaId: string | null;
  readonly phoneNumberId: string | null;
}

export interface EmbeddedSignupRepository {
  buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>>;
  actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>>;
  guardarToken(signupId: string, tenantId: string, accessToken: string, expiresAt: string): Promise<Result<void, string>>;
}

export class HandleCallbackHandler {
  constructor(private readonly repo: EmbeddedSignupRepository) {}

  async ejecutar(metaPayload: unknown): Promise<Result<CallbackResult, CallbackError>> {
    const validated = validarSignupWebhook(metaPayload);
    if (!validated.ok) {
      return err({ kind: "validacion_fallo", cause: validated.error.kind });
    }
    const p = validated.value;

    // Buscar signup existente o crear nuevo
    const existing = await this.repo.buscarPorMetaId(p.id);
    const signupId = existing.ok && existing.value ? existing.value.id : crypto.randomUUID();
    const tenantId = existing.ok && existing.value ? existing.value.tenantId : "pending"; // se asigna en init

    const transicion = existing.ok && existing.value
      ? transicionarEstado(existing.value.status, p.status as EmbeddedSignupStatus)
      : ok(p.status as EmbeddedSignupStatus);
    if (!transicion.ok) {
      return err({ kind: "validacion_fallo", cause: `transicion_invalida: ${transicion.error.kind}` });
    }

    // Persistir (simplificado — la implementación real va en infrastructure)
    const updateData: Record<string, unknown> = {
      status: p.status,
      waba_id: p.waba_id,
      phone_number_id: p.phone_number_id,
      recipient_phone_number: p.recipient_phone_number,
      legal_entity_name: p.legal_entity_name,
      meta_business_id: p.business_id,
      meta_account_id: p.account_id,
      error_message: null,
    };
    if (p.status === "COMPLETED") {
      updateData.completed_at = new Date().toISOString();
    }
    if (existing.ok && existing.value) {
      const upd = await this.repo.actualizar(signupId, updateData);
      if (!upd.ok) return err({ kind: "persistence_failure", cause: upd.error });
    }

    // Guardar token encriptado si viene en el payload
    // La encriptacion XChaCha20-Poly1305 ocurre en TokenVaultRepository.guardar()
    if (p.access_token) {
      await this.repo.guardarToken(signupId, tenantId, p.access_token, p.access_token_expires_at ?? "");
    }

    return ok({
      signupId,
      status: transicion.value,
      wabaId: p.waba_id ?? null,
      phoneNumberId: p.phone_number_id ?? null,
    });
  }
}