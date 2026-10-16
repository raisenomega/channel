/**
 * HUB by Raisen — GET /pay/:tenantSlug/:orderId — landing pública de cobro (Slide 3.3).
 * Pública (sin JWT, R15). Rate-limited, CSRF-rendered, CSP nonce, escape HTML.
 * C4 ≤75.
 */
// PUBLIC: landing publica de pago /pay/:slug/:order (R15); defensas R16 escapeHtml, R17 CSP nonce, R18 rate limit.
import type { RouteDefinition, HttpResponse } from "../../../server/server-types.ts";
import { LoadPagoPageHandler } from "../../application/load-pago-page.handler.ts";
import { renderPagoPage } from "../../infrastructure/landing-page.renderer.ts";
import { RateLimiter } from "../../infrastructure/rate-limit.ts";
import { generarCsrf } from "../../infrastructure/csrf-token.ts";
import { generateNonce } from "../../infrastructure/csp-nonce.ts";

export interface LandingPageDeps {
  readonly loader: LoadPagoPageHandler;
  readonly rateLimiter: RateLimiter;
  readonly stripePublishableKey: string | null;
}

const CSP = (nonce: string): string =>
  `default-src 'self'; script-src 'nonce-${nonce}' https://js.stripe.com; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com; base-uri 'self'; form-action 'self'; object-src 'none'`;

export function rutaLandingPage(deps: LandingPageDeps): RouteDefinition {
  return {
    method: "GET", path: "/pay/:tenantSlug/:orderId",
    handler: async (ctx) => {
      const parts = ctx.path.split("/");
      const slug = parts[2] ?? "";
      const orderId = parts[3] ?? "";
      const ip = (ctx.headers["x-forwarded-for"] as string) ?? "local";
      const rl = await deps.rateLimiter.check(ip, `/pay/${slug}/${orderId}`);
      if (!rl.ok) return { status: 429, body: "", headers: { "Retry-After": "60" } } as HttpResponse;

      const load = await deps.loader.ejecutar(slug, orderId as never);
      if (!load.ok) {
        const msg = load.error.kind === "orden_ya_procesada" ? "Esta orden ya fue procesada." : "No encontramos esta página.";
        return { status: 404, body: msg, contentType: "text/html" } as HttpResponse;
      }
      const nonce = generateNonce();
      const csrf = await generarCsrf(String(load.value.order.id));
      if (!csrf.ok) return { status: 500, body: "Error interno", contentType: "text/html" } as HttpResponse;
      const html = renderPagoPage({
        tenantName: load.value.tenant.name, logoUrl: load.value.tenant.logoUrl,
        primaryColor: load.value.tenant.primaryColor, orderTotal: load.value.order.totalAmount,
        currency: load.value.order.currency, orderDescription: load.value.order.notes,
        items: load.value.items, csrfToken: csrf.value, cspNonce: nonce,
        stripePublishableKey: deps.stripePublishableKey, orderId: String(load.value.order.id),
        tenantSlug: load.value.tenant.slug,
      });
      return {
        status: 200, body: html, contentType: "text/html; charset=utf-8",
        headers: {
          "Content-Security-Policy": CSP(nonce),
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
          "Cache-Control": "no-store",
        },
      };
    },
  };
}
