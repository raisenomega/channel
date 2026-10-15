/**
 * HUB by Raisen — Adapter ATH Movil Business (REAL, 3.2a-BIS, Path A).
 * cobrar() llama a /payment real, persiste pending con ecommerceId + auth_token
 * cifrado, y devuelve el ecommerceId de ATH. Config tras stub explicito ATH_MOVIL_STUB=1.
 * Estados MAYÚSCULA. Nunca loguea tokens. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { OrderState } from "../domain/order.entity.ts";
import type { PaymentState } from "../domain/payment.entity.ts";
import type { PaymentGateway, PaymentError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import type { PaymentRepository } from "../domain/commerce.repository.ts";
import type { AuthTokenCrypto } from "./ath-token.crypto.ts";
import type { AthMovilApiClient, AthPaymentTicket } from "./ath-movil-api.client.ts";
import { crearPayment, MIN_MONTO, MAX_MONTO } from "../domain/payment.entity.ts";

export class AthMovilAdapter implements PaymentGateway {
  constructor(
    private readonly configRepo: PaymentMethodsConfigRepo,
    private readonly paymentRepo: PaymentRepository,
    private readonly crypto: AuthTokenCrypto,
    private readonly makeClient: (publicToken: string, privateToken: string) => AthMovilApiClient,
    private readonly stub: boolean = false,
  ) {}

  async cobrar(order: OrderState, _metodo: string): Promise<Result<string, PaymentError>> {
    if (order.totalAmount < MIN_MONTO) return err({ kind: "cobro_fallido", cause: "monto_debajo_minimo" });
    if (order.totalAmount > MAX_MONTO) return err({ kind: "cobro_fallido", cause: "monto_sobre_maximo" });

    const cfg = await this.configRepo.obtenerDecifrado(order.tenantId, "ath_movil");
    if (!cfg.ok || !cfg.value["publicToken"] || !cfg.value["privateToken"]) {
      return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    }
    if (this.stub) {
      const ticket: AthPaymentTicket = { ecommerceId: "ecommerce_stub_" + crypto.randomUUID(), authToken: "stub_jwt" };
      return this.persistirPending(order, ticket, cfg.value["publicToken"]!);
    }

    const client = this.makeClient(cfg.value["publicToken"]!, cfg.value["privateToken"]!);
    const crear = await client.crearPago({
      total: order.totalAmount, tax: 0, subtotal: order.totalAmount,
      metadata1: String(order.id), metadata2: String(order.tenantId),
      items: [{ name: "compra_hub", description: "Compra HUB", quantity: 1, price: order.totalAmount }],
      timeout: 600,
    });
    if (!crear.ok) return err({ kind: "cobro_fallido", cause: crear.error });
    return this.persistirPending(order, crear.value, cfg.value["publicToken"]!);
  }

  async reembolsar(_payment: PaymentState): Promise<Result<void, PaymentError>> {
    return err({ kind: "reembolso_fallido", cause: "no_implementado" });
  }

  private async persistirPending(order: OrderState, ticket: AthPaymentTicket, _publicToken: string): Promise<Result<string, PaymentError>> {
    const cifrado = await this.crypto.cifrar(ticket.authToken);
    if (!cifrado.ok) return err({ kind: "cobro_fallido", cause: "cifrado_fallido" });
    const payment = crearPayment(order.id, order.tenantId, order.totalAmount, "ath_movil", "human", ticket.ecommerceId, { authTokenEncrypted: cifrado.value });
    if (!payment.ok) return err({ kind: "cobro_fallido", cause: payment.error.kind });
    const guardado = await this.paymentRepo.guardar(payment.value);
    if (!guardado.ok) return err({ kind: "cobro_fallido", cause: "persistencia_fallida" });
    return ok(ticket.ecommerceId);
  }
}