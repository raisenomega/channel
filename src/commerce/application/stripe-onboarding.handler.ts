/**
 * HUB by Raisen — Onboarding Stripe Connect (Express). Crea Account + AccountLink.
 * Modalidad Express (default auditor). is_active=false hasta completar KYC.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { PaymentMethodsConfigRepo } from "./payment-methods-config.repo.ts";
import type { StripeApiClient } from "../infrastructure/stripe-api.client.ts";
import type { RepoError } from "../domain/commerce.repository.ts";

export type OnboardingError =
  | RepoError
  | { readonly kind: "already_onboarded" }
  | { readonly kind: "stripe_error"; readonly cause: string };

export class StripeOnboardingHandler {
  constructor(
    private readonly client: StripeApiClient,
    private readonly configRepo: PaymentMethodsConfigRepo,
  ) {}

  async iniciar(tenantId: TenantId, email: string, refreshUrl: string, returnUrl: string): Promise<Result<{ onboardingUrl: string }, OnboardingError>> {
    const existing = await this.configRepo.obtener(tenantId, "stripe");
    if (!existing.ok) return err(existing.error);
    if (existing.value?.isActive) return err({ kind: "already_onboarded" });

    const account = await this.client.crearAccount({ type: "express", country: "US", email });
    if (!account.ok) return err({ kind: "stripe_error", cause: account.error });

    const config = {
      tenantId, provider: "stripe" as const, env: "prod" as const,
      config: { stripe_account_id: account.value.id, connect_type: "express" },
      secretsEncrypted: Object.freeze({} as Record<string, string>),
      isActive: false,
    };
    const saved = await this.configRepo.guardar(config);
    if (!saved.ok) return err(saved.error);

    const link = await this.client.crearAccountLink({ account: account.value.id, refreshUrl, returnUrl });
    if (!link.ok) return err({ kind: "stripe_error", cause: link.error });
    return ok({ onboardingUrl: link.value.url });
  }
}