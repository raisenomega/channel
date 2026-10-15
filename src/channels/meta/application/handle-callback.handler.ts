/**
 * HUB by Raisen — HandleCallbackHandler: procesa callback Meta.
 * Firma verificada antes de entrar. State MANDATORIO (single-use).
 * Si no existe signup -> error. C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { transicionarEstado } from "../domain/embedded-signup.entity.ts";
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import { validarSignupWebhook } from "./signup-validation.ts";
import type { SignupNotificationPort } from "./signup-notification.port.ts";

export type CallbackError = { readonly kind: "validacion_fallo"; readonly cause: string } | { readonly kind: "persistence_failure"; readonly cause: string } | { readonly kind: "signup_no_encontrado" };

export interface CallbackResult {
  readonly signupId: string;
  readonly status: EmbeddedSignupStatus;
  readonly wabaId: string | null;
  readonly phoneNumberId: string | null;
}

export interface EmbeddedSignupRepository {
  buscarPorId(signupId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>>;
  actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>>;
  guardarToken(signupId: string, tenantId: string, accessToken: string, expiresAt: string): Promise<Result<void, string>>;
}

export interface StateResolver {
  verificarYConsumirState(state: string): Promise<Result<{ signupId: string; tenantId: string } | null, string>>;
}

export class HandleCallbackHandler {
  private readonly repo: EmbeddedSignupRepository;
  private readonly stateResolver: StateResolver;
  private readonly notif: SignupNotificationPort | undefined;

  constructor(repo: EmbeddedSignupRepository, stateResolver: StateResolver, notif?: SignupNotificationPort) {
    this.repo = repo; this.stateResolver = stateResolver; this.notif = notif;
  }

  async ejecutar(metaPayload: unknown, state: string): Promise<Result<CallbackResult, CallbackError>> {
    if (!state) return err({ kind: "validacion_fallo", cause: "state_requerido" });
    const sd = await this.stateResolver.verificarYConsumirState(state);
    if (!sd.ok || !sd.value) return err({ kind: "validacion_fallo", cause: "state_invalido_o_expirado" });
    const existing = await this.repo.buscarPorId(sd.value.signupId);
    if (!existing.ok || !existing.value) return err({ kind: "signup_no_encontrado" });
    const validated = validarSignupWebhook(metaPayload);
    if (!validated.ok) return err({ kind: "validacion_fallo", cause: validated.error.kind });
    const p = validated.value;
    const nuevo = p.status as EmbeddedSignupStatus;
    const transicion = existing.value.status === nuevo ? ok(existing.value.status) : transicionarEstado(existing.value.status, nuevo);
    if (!transicion.ok) return err({ kind: "validacion_fallo", cause: `transicion_invalida: ${transicion.error.kind}` });
    const upd = await this.repo.actualizar(sd.value.signupId, {
      status: p.status, waba_id: p.waba_id, phone_number_id: p.phone_number_id,
      meta_business_id: p.business_id, meta_account_id: p.account_id, error_message: null,
      ...(p.status === "COMPLETED" ? { completed_at: new Date().toISOString() } : {}),
    });
    if (!upd.ok) return err({ kind: "persistence_failure", cause: upd.error });
    if (p.access_token) {
      const tok = await this.repo.guardarToken(sd.value.signupId, sd.value.tenantId, p.access_token, p.access_token_expires_at ?? "");
      if (!tok.ok) return err({ kind: "persistence_failure", cause: tok.error });
    }
    this.emitirCompletado(p, sd.value, transicion.value);
    return ok({ signupId: sd.value.signupId, status: transicion.value, wabaId: p.waba_id ?? null, phoneNumberId: p.phone_number_id ?? null });
  }

  private emitirCompletado(p: { waba_id?: string; phone_number_id?: string }, sd: { signupId: string; tenantId: string }, status: EmbeddedSignupStatus): void {
    if (!this.notif || status !== "COMPLETED") return;
    void this.notif.ejecutar({
      tenantId: sd.tenantId, userId: "", type: "signup_completed", severity: "info",
      title: "WhatsApp configurado", body: "Tu numero de WhatsApp esta listo.",
      payload: { signup_id: sd.signupId, waba_id: p.waba_id ?? null, phone_number_id: p.phone_number_id ?? null },
    });
  }
}