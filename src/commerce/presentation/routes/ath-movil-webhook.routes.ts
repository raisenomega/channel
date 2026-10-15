/**
 * HUB by Raisen — Webhook ATH Movil Business (pull-model).
 * La verdad es /finalize, no el body del webhook. tenantId solo del path.
 * C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import type { TenantId, OrderId } from "../../../shared/domain/ids.ts";
import type { PaymentRepository } from "../../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../../application/payment-methods-config.repo.ts";
import { AthMovilApiClient } from "../../infrastructure/ath-movil-api.client.ts";
import { crearPayment } from "../../domain/payment.entity.ts";

export interface AthWebhookDeps {
  readonly paymentRepo: PaymentRepository;
  readonly configRepo: PaymentMethodsConfigRepo;
  readonly makeClient: (env: "sandbox" | "prod", publicToken: string, privateToken: string) => AthMovilApiClient;
}

export function rutaAthMovilWebhook(deps: AthWebhookDeps): RouteDefinition {
  return {
    method: "POST", path: "/webhooks/ath-movil/:tenantId",
    handler: async (ctx) => {
      const tenantId = (ctx.path.split("/")[3] ?? "") as TenantId;
      const body = (typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body) as Record<string, unknown>;
      const refNumber = String(body.referenceNumber ?? "");
      const orderId = String(body.metadata1 ?? "");
      if (!refNumber || !orderId) return { ok: false, error: { kind: "payload_incompleto" } };

      const cfg = await deps.configRepo.obtener(tenantId, "ath_movil");
      if (!cfg.ok || !cfg.value) return { ok: false, error: { kind: "config_not_found" } };
      const secrets = await deps.configRepo.obtenerDecifrado(tenantId, "ath_movil");
      if (!secrets.ok || !secrets.value) return { ok: false, error: { kind: "config_not_found" } };

      const client = deps.makeClient(cfg.value.env, secrets.value["publicToken"] ?? "", secrets.value["privateToken"] ?? "");
      const fin = await client.finalizar(refNumber);
      if (!fin.ok) return { ok: false, error: { kind: "finalize_error", cause: fin.error } };
      if (fin.value.total !== Number(body.total)) return { ok: false, error: { kind: "tamper_detected" } };
      if (fin.value.status !== "completed") return { ok: true, processed: false };

      const dup = await deps.paymentRepo.buscarPorProviderPaymentId(refNumber, tenantId);
      if (!dup.ok) return { ok: false, error: { kind: "persistence_error" } };
      if (dup.value) return { ok: true, idempotente: true };

      const payment = crearPayment(orderId as OrderId, tenantId, fin.value.total, "ath_movil", "human", refNumber);
      if (!payment.ok) return { ok: false, error: { kind: "pago_invalido" } };
      const p = await deps.paymentRepo.guardar({ ...payment.value, status: "completed" });
      if (!p.ok) return { ok: false, error: { kind: "persistence_error" } };
      return { ok: true, processed: true };
    },
  };
}