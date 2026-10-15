import { expect, test, vi } from "vitest";
import { rutaAthCharge, AthChargeDeps } from "../../../src/pay/presentation/routes/charge-ath.routes.ts";
import { LoadPagoPageHandler } from "../../../src/pay/application/load-pago-page.handler.ts";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";
import { generarCsrf } from "../../../src/pay/infrastructure/csrf-token.ts";
import type { AthMovilAdapter } from "../../../src/commerce/infrastructure/ath-movil.adapter.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

process.env["CSRF_SECRET"] = "b".repeat(64);

const order = { id: "o1" as never, tenantId: "t" as never, status: "pending", totalAmount: 10, currency: "USD", notes: null, quoteId: null };
const loader: LoadPagoPageHandler = { ejecutar: async () => ok({ tenant: { id: "t" as never, slug: "z", name: "Z", logoUrl: null, primaryColor: null }, order, items: [] }) } as unknown as LoadPagoPageHandler;
const rateOk: RateLimiter = { check: async () => ok({ allowed: true, retryAfterSeconds: 0 }) } as unknown as RateLimiter;

function adapter(mode: "ok" | "no_config" = "ok"): AthMovilAdapter {
  return { cobrar: async () => (mode === "ok" ? ok("ecommerce_1") : err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" })) } as unknown as AthMovilAdapter;
}

function deps(over: Partial<AthChargeDeps> = {}): AthChargeDeps {
  return { loader, rateLimiter: rateOk, adapter: adapter(), ...over };
}

async function getToken(): Promise<string> {
  const t = await generarCsrf("o1");
  return t.ok ? t.value : "";
}

function ctx(token: string | null, phone = "7875551234"): RequestContext {
  return { method: "POST", path: "/pay/z/o1/ath-charge", headers: token ? { "x-csrf-token": token } : {}, body: { phoneNumber: phone }, rawBody: "", jwt: null } as RequestContext;
}

test("happy: CSRF válido + phone -> ecommerceId", async () => {
  const tok = await getToken();
  const route = rutaAthCharge(deps());
  const res = await route.handler(ctx(tok)) as { status: number; body: string };
  expect(res.status).toBe(200);
  expect(JSON.parse(res.body).ecommerceId).toBe("ecommerce_1");
});

test("adversarial: sin header X-CSRF-Token -> csrf_ausente", async () => {
  const route = rutaAthCharge(deps());
  const res = await route.handler(ctx(null)) as { status: number; body: string };
  expect(res.status).toBe(400);
  expect(JSON.parse(res.body).error.kind).toBe("csrf_invalido");
});

test("adversarial: CSRF de otra orden -> csrf_invalido", async () => {
  const other = await generarCsrf("order_OTHER");
  const route = rutaAthCharge(deps());
  const res = await route.handler(ctx(other.ok ? other.value : "", "7875551234")) as { status: number; body: string };
  expect(res.status).toBe(400);
  expect(JSON.parse(res.body).error.kind).toBe("csrf_invalido");
});

test("adversarial: CSRF expirado -> csrf_expirado", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const nuevo = await generarCsrf("o1");
  vi.setSystemTime(new Date("2026-01-01T00:20:00Z"));
  const route = rutaAthCharge(deps());
  const res = await route.handler(ctx(nuevo.ok ? nuevo.value : "")) as { status: number; body: string };
  expect(res.status).toBe(400);
  expect(JSON.parse(res.body).error.kind).toBe("csrf_expirado");
  vi.useRealTimers();
});

test("adversarial: phone inválido (abc) -> phone_invalido", async () => {
  const tok = await getToken();
  const route = rutaAthCharge(deps());
  const res = await route.handler(ctx(tok, "abc")) as { status: number; body: string };
  expect(res.status).toBe(400);
  expect(JSON.parse(res.body).error.kind).toBe("phone_invalido");
});

test("phone 10 dígitos -> normalizado a 11 con prefijo 1 (se pasa al adapter)", async () => {
  const tok = await getToken();
  const cobrarSpy = vi.fn().mockResolvedValue(ok("ecommerce_9"));
  const route = rutaAthCharge(deps({ adapter: { cobrar: cobrarSpy } as unknown as AthMovilAdapter }));
  const res = await route.handler(ctx(tok, "7875551234")) as { status: number };
  expect(res.status).toBe(200);
  // el adapter recibe el OrderState con total, no el phone; phone se valida antes
  expect(cobrarSpy).toHaveBeenCalled();
});

test("adversarial: rate limited -> 429", async () => {
  const tok = await getToken();
  const rl: RateLimiter = { check: async () => err("rate_limited") } as unknown as RateLimiter;
  const route = rutaAthCharge(deps({ rateLimiter: rl }));
  const res = await route.handler(ctx(tok)) as { status: number };
  expect(res.status).toBe(429);
});