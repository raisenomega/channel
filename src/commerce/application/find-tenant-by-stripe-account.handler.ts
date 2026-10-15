/**
 * HUB by Raisen — Lookup: dado un stripe account_id, retorna el tenant.
 * (account_id NO es secreto; es identidad de connected account).
 * C4 ≤50 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { PaymentMethodsConfigRepo } from "./payment-methods-config.repo.ts";
import type { RepoError } from "../domain/commerce.repository.ts";

export type LookupError = RepoError | { readonly kind: "tenant_not_found" };

export class FindTenantByStripeAccountHandler {
  constructor(private readonly configRepo: PaymentMethodsConfigRepo) {}

  async buscar(stripeAccountId: string): Promise<Result<TenantId, LookupError>> {
    const cfg = await this.configRepo.findByStripeAccountId(stripeAccountId);
    if (!cfg.ok) return err(cfg.error);
    if (!cfg.value) return err({ kind: "tenant_not_found" });
    return ok(cfg.value.tenantId);
  }
}