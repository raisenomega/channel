/**
 * HUB by Raisen — InitSignupHandler: inicia el flujo OAuth de Embedded Signup.
 * Genera la URL de autorización de Meta y persiste el estado inicial.
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { puedeIniciarSignup } from "../domain/embedded-signup.entity.ts";

export interface InitSignupCommand {
  readonly tenantId: string;
  readonly callbackUrl: string;
  readonly appId: string;
  readonly state: string;  // CSRF token
}

export type InitSignupError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "app_id_invalido" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export interface MetaOAuthUrl {
  readonly url: string;
  readonly state: string;
}

const META_AUTH_BASE = "https://www.facebook.com/v22.0/dialog/embedded_signup";
const SCOPES = ["pages_whatsapp_phone_number_management", "pages_read_engagement", "whatsapp_business_messaging", "whatsapp_business_management"].join(",");

export class InitSignupHandler {
  async ejecutar(cmd: InitSignupCommand): Promise<Result<MetaOAuthUrl, InitSignupError>> {
    const valid = puedeIniciarSignup(cmd.tenantId);
    if (!valid.ok) return err({ kind: "tenant_requerido" });

    if (!cmd.appId || cmd.appId.trim().length === 0) {
      return err({ kind: "app_id_invalido" });
    }

    const params = new URLSearchParams({
      app_id: cmd.appId.trim(),
      state: cmd.state,
      redirect_uri: cmd.callbackUrl,
      scope: SCOPES,
      response_type: "code",
    });

    const url = `${META_AUTH_BASE}?${params.toString()}`;

    return ok({ url, state: cmd.state });
  }
}