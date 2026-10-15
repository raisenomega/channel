/**
 * HUB by Raisen — GET /pay/:tenantSlug/:orderId/ath-poll (Slide 3.3).
 * Polling público ATH. Verifica que ecommerceId pertenezca a (tenantId, orderId).
 * Reutiliza la lógica findPayment -> authorize -> finalize del BC commerce. C4 <=75.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import { RateLimiter } from "../../infrastructure/rate-limit.ts";
import { LoadPagoPageHandler } from "../../application/load-pago-page.handler.ts";
import type { PaymentRepository, OrderRepository } from "../../../commerce/domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../../../commerce/application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../../commerce/infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient, AthMovilTransaction } from "../../../commerce/infrastructure/ath-movil-api.client.ts";
import type { PaymentState } from "../../../commerce/domain/payment.entity.ts";
import { confirmarPaymentAth } from "../../../commerce/domain/payment.entity.ts";

export interface AthPollDeps {
  readonly loader: LoadPagoPageHandler;
  readonly rateLimiter: RateLimiter;
  readonly paymentRepo: PaymentRepository;
  readonly orderRepo: OrderRepository;
  readonly configRepo: PaymentMethodsConfigRepo;
  readonly crypto: AuthTokenCrypto;
  readonly makeClient: (publicToken: string, privateToken: string) => AthMovilApiClient;
}

function ipOf(ctx: { headers: Record<string, unknown> }): string {
  return (ctx.headers["x-forwarded-for"] as string) ?? "local";
}

export function rutaAthPoll(deps: AthPollDeps): RouteDefinition {
  return {
    method: "GET", path: "/pay/:tenantSlug/:orderId/ath-poll",
    handler: async (ctx) => {
      const parts = ctx.path.split("/");
      const slug = parts[2] ?? "";
      const orderId = parts[3] ?? "";
      const ecommerceId = new URL(ctx.path, "http://localhost").searchParams.get("ecommerceId") ?? "";
      const rl = await deps.rateLimiter.check(ipOf(ctx), `/pay/${slug}/${orderId}/ath-poll`, 60);
      if (!rl.ok) return { status: 429, body: "", headers: { "Retry-After": "60" } };
      const load = await deps.loader.ejecutar(slug, orderId as never);
      if (!load.ok) return { status: 404, body: JSON.stringify({ estado: "failed" }) };
      const tenantId = load.value.tenant.id;
      const pending = await deps.paymentRepo.buscarPorProviderPaymentId(ecommerceId, tenantId);
      if (!pending.ok || !pending.value || pending.value.orderId !== load.value.order.id) {
        return { status: 200, body: JSON.stringify({ estado: "pending" }) };
      }
      const cfg = await deps.configRepo.obtenerDecifrado(tenantId, "ath_movil");
      if (!cfg.ok || !cfg.value["publicToken"]) return { status: 404, body: JSON.stringify({ estado: "failed" }) };
      const client = deps.makeClient(cfg.value["publicToken"]!, "");
      const find = await client.buscarPago(ecommerceId);
      if (!find.ok || find.value.estado === "OPEN") return { status: 200, body: JSON.stringify({ estado: "pending" }) };
      if (find.value.estado === "CANCEL") return { status: 200, body: JSON.stringify({ estado: "failed" }) };
      let txn = find.value;
      if (find.value.estado === "CONFIRM") {
        if (!pending.value.authTokenEncrypted) return { status: 200, body: JSON.stringify({ estado: "pending" }) };
        const auth = await deps.crypto.descifrar(pending.value.authTokenEncrypted);
        if (!auth.ok) return { status: 200, body: JSON.stringify({ estado: "pending" }) };
        const done = await client.autorizar(auth.value);
        if (!done.ok || done.value.estado !== "COMPLETED") return { status: 200, body: JSON.stringify({ estado: "pending" }) };
        txn = done.value;
      }
      return finalizar(deps, pending.value, txn);
    },
  };
}
async function finalizar(deps: AthPollDeps, pay: PaymentState, tx: AthMovilTransaction): Promise<Record<string, unknown>> {
  const order = await deps.orderRepo.buscar(pay.orderId, pay.tenantId);
  const bad = { status: 200, body: JSON.stringify({ estado: "failed" }) };
  if (!order.ok || !order.value || order.value.totalAmount !== tx.total) return bad;
  const confirmado = confirmarPaymentAth(pay, tx.referenceNumber, tx.netAmount);
  if (!confirmado.ok) return bad;
  const g = await deps.paymentRepo.guardar(confirmado.value);
  if (!g.ok) return bad;
  return { status: 200, body: JSON.stringify({ estado: "completed", referenceNumber: tx.referenceNumber }) };
}