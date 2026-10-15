/**
 * HUB by Raisen — Composición de deps de la landing pública de cobro (Slide 3.3).
 * Ensambla handlers, rutas, data sources, rate limiter y adapters ATH/Stripe.
 * C4 <=75.
 */
import { SupabasePaymentRepo } from "../commerce/infrastructure/supabase-payment.repo.ts";
import { SupabaseOrderRepo } from "../commerce/infrastructure/supabase-order.repo.ts";
import { SupabasePaymentMethodsConfigRepo } from "../commerce/infrastructure/supabase-payment-methods-config.repo.ts";
import { SupabaseAuthTokenCrypto } from "../commerce/infrastructure/ath-token.crypto.ts";
import { AthMovilApiClient } from "../commerce/infrastructure/ath-movil-api.client.ts";
import { AthMovilAdapter } from "../commerce/infrastructure/ath-movil.adapter.ts";
import { PayDataSources } from "../pay/infrastructure/pay-data-sources.ts";
import { LoadPagoPageHandler } from "../pay/application/load-pago-page.handler.ts";
import { RateLimiter } from "../pay/infrastructure/rate-limit.ts";
import type { LandingPageDeps } from "../pay/presentation/routes/landing-page.routes.ts";
import type { AthChargeDeps } from "../pay/presentation/routes/charge-ath.routes.ts";
import type { AthPollDeps } from "../pay/presentation/routes/ath-poll.routes.ts";
import type { PagoResultDeps } from "../pay/presentation/routes/pago-result.routes.ts";

declare const process: { env: Record<string, string | undefined> };
function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export interface PayDeps {
  readonly landing: LandingPageDeps;
  readonly charge: AthChargeDeps;
  readonly poll: AthPollDeps;
  readonly result: PagoResultDeps;
  readonly sources: PayDataSources;
}

function stubMode(): boolean {
  return getEnv("ATH_MOVIL_STUB") === "1";
}

export function buildPayDeps(): PayDeps {
  const paymentRepo = new SupabasePaymentRepo();
  const orderRepo = new SupabaseOrderRepo();
  const configRepo = new SupabasePaymentMethodsConfigRepo();
  const crypto = new SupabaseAuthTokenCrypto();
  const makeClient = (publicToken: string, privateToken: string) => new AthMovilApiClient(publicToken, privateToken);
  const adapter = new AthMovilAdapter(configRepo, paymentRepo, crypto, makeClient, stubMode());
  const sources = new PayDataSources();
  const loader = new LoadPagoPageHandler(sources);
  const rateLimiter = new RateLimiter(10);
  return {
    landing: { loader, rateLimiter, stripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY") ?? null },
    charge: { loader, rateLimiter, adapter },
    poll: { loader, rateLimiter, paymentRepo, orderRepo, configRepo, crypto, makeClient },
    result: { rateLimiter },
    sources,
  };
}