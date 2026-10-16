import { expect, test, vi } from "vitest";
import { rutaStripePrepare, StripePrepareDeps } from "../../../src/commerce/presentation/routes/stripe-prepare.routes.ts";
import type { OrderRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type { StripeAdapter } from "../../../src/commerce/infrastructure/stripe.adapter.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

vi.mock("../../../src/server/jwt-verify.ts", () => ({
  parsearJwtClaims: async (auth: string | null) =>
    auth ? ok({ userId: "u1", tenantId: "tenant-A", exp: 1e15 }) : err({ kind: "token_ausente" }),
}));

const TID = "tenant-A" as never;
const OID = "order-1" as never;
const order: OrderState = { id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: 100, currency: "USD", aiConfidence: null, createdAt: new Date() };

class MockOrderRepo implements OrderRepository {
  found: OrderState | null = order;
  async guardar() { return ok(undefined); }
  async buscar(_id: string): Promise<Result<OrderState | null, never>> { return ok(this.found); }
  async buscarPorContacto() { return ok([]); }
}

function adapterResult(mode: "ok" | "no_config" | "sin_cs"): { preparar: StripeAdapter["preparar"] } {
  return {
    preparar: async () => {
      if (mode === "no_config") return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
      if (mode === "sin_cs") return err({ kind: "cobro_fallido", cause: "sin_client_secret" });
      return ok({ paymentIntentId: "pi_1", clientSecret: "pi_secret_x" });
    },
  } as unknown as { preparar: StripeAdapter["preparar"] };
}

function deps(mode: "ok" | "no_config" | "sin_cs" = "ok", found: OrderState | null = order): StripePrepareDeps {
  const repo = new MockOrderRepo();
  repo.found = found;
  return { orderRepo: repo, adapter: adapterResult(mode) as unknown as StripeAdapter };
}

function ctx(jwt = "Bearer x", body: Record<string, unknown> = { orderId: "order-1" }): RequestContext {
  return { method: "POST", path: "/commerce/stripe/prepare", headers: { authorization: jwt }, body, rawBody: JSON.stringify(body), jwt } as RequestContext;
}

test("happy: preparar devuelve paymentIntentId + clientSecret", async () => {
  const route = rutaStripePrepare(deps());
  const res = await route.handler(ctx());
  expect((res as { ok: boolean }).ok).toBe(true);
  const data = (res as { data: { paymentIntentId: string; clientSecret: string } }).data;
  expect(data.paymentIntentId).toBe("pi_1");
  expect(data.clientSecret).toBe("pi_secret_x");
});

test("sin JWT -> token_ausente", async () => {
  const route = rutaStripePrepare(deps());
  const res = await route.handler(ctx("")) as { status?: number; body: string };
  // Hotfix G: requireTenantAuth devuelve HttpResponse 401 con el error en el body JSON.
  expect(res.status).toBe(401);
  expect(JSON.parse(res.body).error.kind).toBe("token_ausente");
});

test("sin orderId en body -> order_requerido", async () => {
  const route = rutaStripePrepare(deps());
  const res = await route.handler(ctx("Bearer x", {}));
  expect((res as { error: { kind: string } }).error.kind).toBe("order_requerido");
});

test("order inexistente -> order_not_found", async () => {
  const route = rutaStripePrepare(deps("ok", null));
  const res = await route.handler(ctx());
  expect((res as { error: { kind: string } }).error.kind).toBe("order_not_found");
});

test("tenant sin config stripe -> sin_configuracion_tenant", async () => {
  const route = rutaStripePrepare(deps("no_config"));
  const res = await route.handler(ctx());
  expect((res as { error: { cause: string } }).error.cause).toBe("sin_configuracion_tenant");
});

test("client_secret ausente de la respuesta del proveedor -> sin_client_secret", async () => {
  const route = rutaStripePrepare(deps("sin_cs"));
  const res = await route.handler(ctx());
  expect((res as { error: { cause: string } }).error.cause).toBe("sin_client_secret");
});