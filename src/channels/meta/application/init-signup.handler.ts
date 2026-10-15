/**
 * HUB by Raisen — InitSignupHandler: inicia flujo OAuth Embedded Signup Meta.
 * Persiste state CSRF con TTL 10min + signup_id enlace.
 * Crea fila embedded_signups con status CREATED y meta_webhook_id.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { puedeIniciarSignup } from "../domain/embedded-signup.entity.ts";

export interface InitSignupCommand {
  readonly tenantId: string;
  readonly callbackUrl: string;
  readonly appId: string;
}

export type InitSignupError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "app_id_invalido" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export interface MetaOAuthUrl {
  readonly url: string;
  readonly state: string;
  readonly signupId: string;
}

export interface InitSignupRepository {
  guardarState(tenantId: string, state: string, signupId: string, expiresAt: string): Promise<Result<void, string>>;
  crearSignup(tenantId: string, signupId: string, metaWebhookId: string): Promise<Result<void, string>>;
}

const META_AUTH_BASE = "https://www.facebook.com/v22.0/dialog/embedded_signup";
const SCOPES = ["pages_whatsapp_phone_number_management", "pages_read_engagement", "whatsapp_business_messaging", "whatsapp_business_management"].join(",");

export class InitSignupHandler {
  constructor(private readonly repo: InitSignupRepository) {}

  async ejecutar(cmd: InitSignupCommand): Promise<Result<MetaOAuthUrl, InitSignupError>> {
    const valid = puedeIniciarSignup(cmd.tenantId);
    if (!valid.ok) return err({ kind: "tenant_requerido" });
    if (!cmd.appId || !cmd.appId.trim()) return err({ kind: "app_id_invalido" });

    const state = crypto.randomUUID();
    const signupId = crypto.randomUUID();
    const metaWebhookId = signupId; // El id que Meta enviara en el webhook
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const stateRes = await this.repo.guardarState(cmd.tenantId, state, signupId, expiresAt);
    if (!stateRes.ok) return err({ kind: "persistence_failure", cause: `state:${stateRes.error}` });

    const signupRes = await this.repo.crearSignup(cmd.tenantId, signupId, metaWebhookId);
    if (!signupRes.ok) return err({ kind: "persistence_failure", cause: `signup:${signupRes.error}` });

    const params = new URLSearchParams({
      app_id: cmd.appId.trim(), state, redirect_uri: cmd.callbackUrl, scope: SCOPES, response_type: "code",
    });
    return ok({ url: `${META_AUTH_BASE}?${params.toString()}`, state, signupId });
  }
}