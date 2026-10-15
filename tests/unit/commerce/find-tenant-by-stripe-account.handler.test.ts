import { expect, test } from "vitest";
import { FindTenantByStripeAccountHandler } from "../../../src/commerce/application/find-tenant-by-stripe-account.handler.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;

test("buscar account existente -> tenantId", async () => {
  const repo: PaymentMethodsConfigRepo = {
    obtener: async () => ok(null),
    obtenerDecifrado: async () => ok({}),
    findByStripeAccountId: async () => ok({ tenantId: TID, provider: "stripe", env: "prod", config: { stripe_account_id: "acct_1" }, secretsEncrypted: {}, isActive: true }),
    guardar: async () => ok(undefined),
  };
  const handler = new FindTenantByStripeAccountHandler(repo);
  const r = await handler.buscar("acct_1");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(TID);
});

test("buscar account inexistente -> tenant_not_found", async () => {
  const repo: PaymentMethodsConfigRepo = {
    obtener: async () => ok(null),
    obtenerDecifrado: async () => ok({}),
    findByStripeAccountId: async () => ok(null),
    guardar: async () => ok(undefined),
  };
  const handler = new FindTenantByStripeAccountHandler(repo);
  const r = await handler.buscar("acct_nope");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("tenant_not_found");
});