import { expect, test } from "vitest";
import { rutaPagoSuccess, rutaPagoFailed, PagoResultDeps } from "../../../src/pay/presentation/routes/pago-result.routes.ts";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const rateOk: RateLimiter = { check: async () => ok({ allowed: true, retryAfterSeconds: 0 }) } as unknown as RateLimiter;

function ctx(path: string): RequestContext {
  return { method: "GET", path, headers: {}, body: null, rawBody: null, jwt: null } as RequestContext;
}

test("success: renderiza referencia escapada", async () => {
  const route = rutaPagoSuccess({ rateLimiter: rateOk });
  const res = await route.handler(ctx("/pay/z/o1/success?ref=REF_123")) as { status: number; body: string };
  expect(res.status).toBe(200);
  expect(res.body).toContain("REF_123");
});

test("success: ref con HTML queda escapado (XSS)", async () => {
  const route = rutaPagoSuccess({ rateLimiter: rateOk });
  const res = await route.handler(ctx(`/pay/z/o1/success?ref=<script>`)) as { body: string };
  expect(res.body).not.toContain("<script>");
  expect(res.body).toContain("&lt;script&gt;");
});

test("failed: contiene reintentar al pay del order", async () => {
  const route = rutaPagoFailed({ rateLimiter: rateOk });
  const res = await route.handler(ctx("/pay/z/o1/failed")) as { body: string };
  expect(res.body).toContain("Pago rechazado o cancelado");
  expect(res.body).toContain("/pay/z/o1");
});

test("failed: rate limited -> 429", async () => {
  const rl: RateLimiter = { check: async () => err("rate_limited") } as unknown as RateLimiter;
  const deps: PagoResultDeps = { rateLimiter: rl };
  const route = rutaPagoFailed(deps);
  const res = await route.handler(ctx("/pay/z/o1/failed")) as { status: number };
  expect(res.status).toBe(429);
});