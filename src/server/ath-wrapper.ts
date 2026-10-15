/**
 * HUB by Raisen — Construcción de dependencias ATH Móvil REAL (3.2a-BIS).
 * Centraliza client, crypto y repos para las rutas de cobro/confirmación.
 * C4 ≤75 lineas.
 */
import { SupabasePaymentRepo } from "../commerce/infrastructure/supabase-payment.repo.ts";
import { SupabaseOrderRepo } from "../commerce/infrastructure/supabase-order.repo.ts";
import { SupabasePaymentMethodsConfigRepo } from "../commerce/infrastructure/supabase-payment-methods-config.repo.ts";
import { SupabaseAuthTokenCrypto } from "../commerce/infrastructure/ath-token.crypto.ts";
import { AthMovilApiClient } from "../commerce/infrastructure/ath-movil-api.client.ts";
import { AthMovilAdapter } from "../commerce/infrastructure/ath-movil.adapter.ts";
import type { AthConfirmDeps } from "../commerce/presentation/routes/ath-movil-confirm.routes.ts";

export interface AthDeps {
  readonly confirm: AthConfirmDeps;
  readonly adapter: AthMovilAdapter;
}

function stubMode(): boolean {
  const v = typeof Deno !== "undefined"
    ? (Deno.env.get?.("ATH_MOVIL_STUB") ?? "")
    : (process.env["ATH_MOVIL_STUB"] ?? "");
  return v === "1";
}

export function buildAthDeps(): AthDeps {
  const paymentRepo = new SupabasePaymentRepo();
  const orderRepo = new SupabaseOrderRepo();
  const configRepo = new SupabasePaymentMethodsConfigRepo();
  const crypto = new SupabaseAuthTokenCrypto();
  const makeClient = (publicToken: string, privateToken: string) => new AthMovilApiClient(publicToken, privateToken);
  return {
    confirm: { paymentRepo, orderRepo, configRepo, crypto, makeClient },
    adapter: new AthMovilAdapter(configRepo, paymentRepo, crypto, makeClient, stubMode()),
  };
}