import { expect, test, vi } from "vitest";
import { rutaLandingPage, LandingPageDeps } from "../../../src/pay/presentation/routes/landing-page.routes.ts";
import { LoadPagoPageHandler } from "../../../src/pay/application/load-pago-page.handler.ts";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

process.env["CSRF_SECRET"] = "a".repeat(64);

const load = (over: Partial<LoadPagoPageHandler> = {}): LoadPagoPageHandler =>
  ({
    ejecutar: async () => ok({
      tenant: { id: "t" as never, slug: "z", name: "Zafacones", logoUrl: null, primaryColor: null },
      order: { id: "o1" as never, tenantId: "t" as never, status: "pending", totalAmount: 10, currency: "USD", notes: null, quoteId: null },
      items: [],
    }),
    ...over,
  }) as unknown as LoadPagoPageHandler;

const rateOk: RateLimiter = { check: async () => ok({ allowed: true, retryAfterSeconds: 0 }) } as unknown as RateLimiter;

function deps(over: Partial<LandingPageDeps> = {}): LandingPageDeps {
  return { loader: load(), rateLimiter: rateOk, stripePublishableKey: "pk_test_1", ...over };
}

function ctx(slug = "z", orderId = "o1"): RequestContext {
  return { method: "GET", path: `/pay/${slug}/${orderId}`, headers: {}, body: null, rawBody: null, jwt: null } as RequestContext;
}

test("happy: 200 html + headers CSP/nosniff/permissions", async () => {
  const route = rutaLandingPage(deps());
  const res = await route.handler(ctx()) as { status: number; headers?: Record<string, string>; body: string };
  expect(res.status).toBe(200);
  expect(res.body).toContain("<!DOCTYPE html>");
  const hdrs = res.headers ?? {};
  expect(hdrs["X-Content-Type-Options"]).toBe("nosniff");
  expect(hdrs["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(hdrs["Content-Security-Policy"]).toContain("nonce-");
  expect(hdrs["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
});

test("adversarial: tenant no encontrado -> 404", async () => {
  const route = rutaLandingPage(deps({ loader: load({ ejecutar: async () => err({ kind: "tenant_no_encontrado" }) }) }));
  const res = await route.handler(ctx("nosuch")) as { status: number };
  expect(res.status).toBe(404);
});

test("adversarial: order no encontrada -> 404", async () => {
  const route = rutaLandingPage(deps({ loader: load({ ejecutar: async () => err({ kind: "order_no_encontrada" }) }) }));
  const res = await route.handler(ctx("z", "o999")) as { status: number };
  expect(res.status).toBe(404);
});

test("adversarial: order ya procesada (paid) -> 404 con mensaje", async () => {
  const route = rutaLandingPage(deps({ loader: load({ ejecutar: async () => err({ kind: "orden_ya_procesada" }) }) }));
  const res = await route.handler(ctx()) as { status: number; body: string };
  expect(res.status).toBe(404);
  expect(res.body).toContain("ya fue procesada");
});

test("adversarial: rate limited -> 429 con Retry-After", async () => {
  const rl: RateLimiter = { check: async () => err("rate_limited") } as unknown as RateLimiter;
  const route = rutaLandingPage(deps({ rateLimiter: rl }));
  const res = await route.handler(ctx()) as { status: number; headers?: Record<string, string> };
  expect(res.status).toBe(429);
  expect((res.headers ?? {})["Retry-After"]).toBe("60");
});

test("CSP nonce match: el script inline usa el nonce del header CSP", async () => {
  const route = rutaLandingPage(deps());
  const res = await route.handler(ctx()) as { headers?: Record<string, string>; body: string };
  const csp = res.headers?.["Content-Security-Policy"] ?? "";
  const nonce = csp.match(/nonce-([^'; ]+)/)?.[1] ?? "";
  expect(nonce.length).toBeGreaterThan(0);
  expect(res.body.indexOf(`nonce="${nonce}"`)).toBeGreaterThan(-1);
});

test("adversarial XSS: tenant name con <script> no aparece crudo en HTML", async () => {
  const loaderXss = load({ ejecutar: async () => ok({
    tenant: { id: "t" as never, slug: "z", name: "<script>alert(1)</script>", logoUrl: null, primaryColor: null },
    order: { id: "o1" as never, tenantId: "t" as never, status: "pending", totalAmount: 10, currency: "USD", notes: null, quoteId: null },
    items: [],
  }) });
  const route = rutaLandingPage(deps({ loader: loaderXss }));
  const res = await route.handler(ctx()) as { body: string };
  expect(res.body).not.toContain("<script>alert(1)</script>");
  expect(res.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
});