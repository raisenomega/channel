import { expect, test } from "vitest";
import { StripeOnboardingHandler } from "../../../src/commerce/application/stripe-onboarding.handler.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;

const cfgRepoOk: PaymentMethodsConfigRepo = {
  obtener: async () => ok(null),
  obtenerDecifrado: async () => ok({}),
  findByStripeAccountId: async () => ok(null),
  guardar: async () => ok(undefined),
};
const clientOk = {
  crearAccount: async () => ok({ id: "acct_new" }),
  crearAccountLink: async () => ok({ url: "https://connect.stripe.com/setup/x" }),
};

test("onboarding crea account + link, guarda config is_active=false", async () => {
  const saved: unknown[] = [];
  const repo: PaymentMethodsConfigRepo = { ...cfgRepoOk, guardar: async (c) => { saved.push(c); return ok(undefined); } };
  const handler = new StripeOnboardingHandler(clientOk as never, repo);
  const r = await handler.iniciar(TID, "a@b.c", "https://x/r", "https://x/c");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.onboardingUrl).toContain("stripe.com");
  expect(saved.length).toBe(1);
  const cfg = saved[0] as { isActive: boolean; config: Record<string, unknown> };
  expect(cfg.isActive).toBe(false);
  expect(cfg.config["stripe_account_id"]).toBe("acct_new");
});

test("already_onboarded si config stripe activa", async () => {
  const repo: PaymentMethodsConfigRepo = { ...cfgRepoOk, obtener: async () => ok({ tenantId: TID, provider: "stripe" as const, env: "prod" as const, config: { stripe_account_id: "acct_x" }, secretsEncrypted: {}, isActive: true }) };
  const handler = new StripeOnboardingHandler(clientOk as never, repo);
  const r = await handler.iniciar(TID, "a@b.c", "x", "y");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("already_onboarded");
});

test("stripe_error si crearAccount falla", async () => {
  const client = { crearAccount: async () => err("http_500"), crearAccountLink: async () => ok({ url: "" }) };
  const handler = new StripeOnboardingHandler(client as never, cfgRepoOk);
  const r = await handler.iniciar(TID, "a@b.c", "x", "y");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("stripe_error");
});