/**
 * HUB by Raisen — Tipos e interfaz del repositorio de Embedded Signup Meta.
 * Separado de handle-callback.handler.ts para cumplir C4.
 */
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import type { Result } from "../../../shared/domain/result.ts";

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