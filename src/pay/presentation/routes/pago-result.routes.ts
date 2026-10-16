/**
 * HUB by Raisen — GET /pay/:tenantSlug/:orderId/success|failed (Slide 3.3).
 * Páginas de resultado. Rate-limited. Escape de referenceNumber. C4 <=75.
 */
// PUBLIC: paginas de resultado success/failed de la landing publica; rate limit, sin datos sensibles.
import type { RouteDefinition } from "../../../server/server-types.ts";
import { RateLimiter } from "../../infrastructure/rate-limit.ts";
import { escapeHtml } from "../../infrastructure/landing-page.renderer.ts";

export interface PagoResultDeps { readonly rateLimiter: RateLimiter; }

function ipOf(ctx: { headers: Record<string, unknown> }): string {
  return (ctx.headers["x-forwarded-for"] as string) ?? "local";
}

function page(msg: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resultado</title></head><body style="font-family:system-ui;text-align:center;padding:48px"><h1>${msg}</h1></body></html>`;
}

export function rutaPagoSuccess(deps: PagoResultDeps): RouteDefinition {
  return {
    method: "GET", path: "/pay/:tenantSlug/:orderId/success",
    handler: async (ctx) => {
      const parts = ctx.path.split("/");
      const slug = parts[2] ?? "";
      const orderId = parts[3] ?? "";
      const rl = await deps.rateLimiter.check(ipOf(ctx), `/pay/${slug}/${orderId}/success`);
      if (!rl.ok) return { status: 429, body: "", headers: { "Retry-After": "60" } };
      const ref = escapeHtml(new URL(ctx.path, "http://localhost").searchParams.get("ref") ?? "");
      return { status: 200, body: page(`Pago exitoso<br>Referencia: ${ref}`) };
    },
  };
}

export function rutaPagoFailed(deps: PagoResultDeps): RouteDefinition {
  return {
    method: "GET", path: "/pay/:tenantSlug/:orderId/failed",
    handler: async (ctx) => {
      const parts = ctx.path.split("/");
      const slug = parts[2] ?? "";
      const orderId = parts[3] ?? "";
      const rl = await deps.rateLimiter.check(ipOf(ctx), `/pay/${slug}/${orderId}/failed`);
      if (!rl.ok) return { status: 429, body: "", headers: { "Retry-After": "60" } };
      const retry = escapeHtml(`/pay/${slug}/${orderId}`);
      return { status: 200, body: page(`Pago rechazado o cancelado. <a href="${retry}">Reintentar</a>`) };
    },
  };
}
