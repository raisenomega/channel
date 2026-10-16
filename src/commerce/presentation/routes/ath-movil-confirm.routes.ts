/**
 * HUB by Raisen — Confirmación ATH Móvil REAL (3.2a-BIS, Path A).
 * POST /commerce/ath-movil/confirm. tenantId del JWT, nunca del body.
 * Fuente de verdad = ATH (findPayment + authorization), anti-tamper con total.
 * Persiste netAmount; limpia authToken. C4 ≤75.
 * Hotfix G: requireTenantAuth (antes extractJwt+parsearJwtClaims eran incompatibles: 401 siempre).
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import type { PaymentRepository, OrderRepository } from "../../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../../application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient, AthMovilTransaction } from "../../infrastructure/ath-movil-api.client.ts";
import type { PaymentState } from "../../domain/payment.entity.ts";
import { confirmarPaymentAth } from "../../domain/payment.entity.ts";
import { requireTenantAuth } from "../../../server/auth-helpers.ts";
import { tid } from "../../../server/server-types.ts";
export interface AthConfirmDeps {
  readonly paymentRepo: PaymentRepository;
  readonly orderRepo: OrderRepository;
  readonly configRepo: PaymentMethodsConfigRepo;
  readonly crypto: AuthTokenCrypto;
  readonly makeClient: (publicToken: string, privateToken: string) => AthMovilApiClient;
}
export function rutaAthMovilConfirm(deps: AthConfirmDeps): RouteDefinition {
  return {
    method: "POST", path: "/commerce/ath-movil/confirm",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const tenantId = tid(auth.value.tenantId);
      const ecommerceId = String(((ctx.body ?? {}) as Record<string, unknown>)["ecommerceId"] ?? "");

      const pending = await deps.paymentRepo.buscarPorProviderPaymentId(ecommerceId, tenantId);
      if (!pending.ok) return { error: { kind: "persistence_error" } };
      if (!pending.value) return { error: { kind: "pago_no_encontrado" } };

      const cfg = await deps.configRepo.obtenerDecifrado(tenantId, "ath_movil");
      if (!cfg.ok || !cfg.value["publicToken"]) return { error: { kind: "config_not_found" } };
      const client = deps.makeClient(cfg.value["publicToken"]!, "");

      const find = await client.buscarPago(ecommerceId);
      if (!find.ok) return { error: { kind: "find_error", cause: find.error } };
      if (find.value.estado === "OPEN") return { ok: true, estado: "pending" };
      if (find.value.estado === "CANCEL") return { ok: true, estado: "failed" };

      if (find.value.estado === "CONFIRM") {
        if (!pending.value.authTokenEncrypted) return { error: { kind: "auth_token_ausente" } };
        const authTok = await deps.crypto.descifrar(pending.value.authTokenEncrypted);
        if (!authTok.ok) return { error: { kind: "auth_token_invalido" } };
        const tx = await client.autorizar(authTok.value);
        if (!tx.ok) return { error: { kind: "authorize_error", cause: tx.error } };
        if (tx.value.estado !== "COMPLETED") return { error: { kind: "authorize_no_completed" } };
        return finalizar(deps, pending.value, tx.value);
      }

      const order = await deps.orderRepo.buscar(pending.value.orderId, tenantId);
      if (!order.ok) return { error: { kind: "persistence_error" } };
      if (!order.value || order.value.totalAmount !== find.value.total) return { error: { kind: "tamper_detected" } };
      return finalizar(deps, pending.value, find.value);
    },
  };
}
async function finalizar(deps: AthConfirmDeps, pay: PaymentState, tx: AthMovilTransaction): Promise<Record<string, unknown>> {
  const order = await deps.orderRepo.buscar(pay.orderId, pay.tenantId);
  if (!order.ok) return { error: { kind: "persistence_error" } };
  if (!order.value || order.value.totalAmount !== tx.total) return { error: { kind: "tamper_detected" } };
  const dup = await deps.paymentRepo.buscarPorProviderPaymentId(tx.referenceNumber, pay.tenantId);
  if (!dup.ok) return { error: { kind: "persistence_error" } };
  if (dup.value) return { ok: true, idempotente: true };
  const confirmado = confirmarPaymentAth(pay, tx.referenceNumber, tx.netAmount);
  if (!confirmado.ok) return { error: { kind: "pago_invalido" } };
  const guardado = await deps.paymentRepo.guardar(confirmado.value);
  if (!guardado.ok) return { error: { kind: "persistence_error" } };
  return { ok: true, estado: "completed", referenceNumber: tx.referenceNumber, netAmount: tx.netAmount };
}
