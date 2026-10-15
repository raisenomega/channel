/**
 * HUB by Raisen — Ruta onboarding Stripe Connect (JWT). tenantId del path debe
 * matchear claims del JWT (doble defensa). C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import { parsearJwtClaims } from "../../../server/jwt-verify.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { StripeOnboardingHandler } from "../../application/stripe-onboarding.handler.ts";

export interface StripeOnboardingDeps {
  readonly onboarding: StripeOnboardingHandler;
  readonly refreshUrl: string;
  readonly returnUrl: string;
}

export function rutaStripeOnboarding(deps: StripeOnboardingDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:tenantId/stripe-onboarding",
    handler: async (ctx) => {
      const claims = await parsearJwtClaims((ctx.headers["authorization"] ?? ctx.headers["Authorization"]) as string | null);
      if (!claims.ok) return { ok: false, error: claims.error };

      const pathTenantId = ctx.path.split("/")[2] ?? "";
      if (pathTenantId !== claims.value.tenantId) return { ok: false, error: { kind: "cross_tenant_denied" } };

      const body = (typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body) as Record<string, unknown>;
      const email = String(body.email ?? "");
      if (!email) return { ok: false, error: { kind: "email_requerido" } };

      const result = await deps.onboarding.iniciar(pathTenantId as TenantId, email, deps.refreshUrl, deps.returnUrl);
      return result.ok ? { ok: true, data: { onboardingUrl: result.value.onboardingUrl } } : { ok: false, error: result.error };
    },
  };
}