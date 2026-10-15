/**
 * HUB by Raisen — Composicion de deps de Stripe Connect para el servidor.
 * Construye webhook + onboarding deps desde env. C4 ≤75.
 */
import { SupabasePaymentRepo } from "../commerce/infrastructure/supabase-payment.repo.ts";
import { SupabasePaymentMethodsConfigRepo } from "../commerce/infrastructure/supabase-payment-methods-config.repo.ts";
import { StripeApiClient } from "../commerce/infrastructure/stripe-api.client.ts";
import { StripeSignatureVerifier } from "../commerce/infrastructure/stripe-signature.verifier.ts";
import { StripeWebhookHandler } from "../commerce/infrastructure/stripe-webhook.handler.ts";
import { StripeOnboardingHandler } from "../commerce/application/stripe-onboarding.handler.ts";
import { StripeAdapter } from "../commerce/infrastructure/stripe.adapter.ts";
import type { StripeWebhookDeps } from "../commerce/presentation/routes/stripe-webhook.routes.ts";
import type { StripeOnboardingDeps } from "../commerce/presentation/routes/stripe-onboarding.routes.ts";

declare const process: { env: Record<string, string | undefined> };
function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export function buildStripe(): StripeWebhookDeps & StripeOnboardingDeps {
  const paymentRepo = new SupabasePaymentRepo();
  const configRepo = new SupabasePaymentMethodsConfigRepo();
  const client = new StripeApiClient(getEnv("STRIPE_SECRET_KEY") ?? "", getEnv("STRIPE_API_VERSION") ?? "2024-10-28.acacia");
  return {
    webhookHandler: new StripeWebhookHandler(paymentRepo, configRepo),
    verifier: new StripeSignatureVerifier(getEnv("STRIPE_WEBHOOK_SECRET") ?? ""),
    onboarding: new StripeOnboardingHandler(client, configRepo),
    refreshUrl: getEnv("STRIPE_ONBOARDING_REFRESH_URL") ?? "",
    returnUrl: getEnv("STRIPE_ONBOARDING_RETURN_URL") ?? "",
  };
}

export function buildStripeAdapter(): StripeAdapter {
  const configRepo = new SupabasePaymentMethodsConfigRepo();
  return new StripeAdapter(configRepo, new StripeApiClient(getEnv("STRIPE_SECRET_KEY") ?? "", getEnv("STRIPE_API_VERSION") ?? "2024-10-28.acacia"));
}