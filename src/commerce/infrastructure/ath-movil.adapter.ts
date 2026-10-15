/**
 * HUB by Raisen — Adapter ATH Movil Business ECommerce (PaymentGateway).
 * Pull-model: cobrar() registra intencion (refNumber uuid); la confirmacion
 * real llega por webhook -> /finalize. Si no hay credenciales, stub error.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { OrderState } from "../domain/order.entity.ts";
import type { PaymentState } from "../domain/payment.entity.ts";
import type { PaymentGateway } from "../domain/commerce.repository.ts";
import type { PaymentError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import { MIN_MONTO } from "../domain/payment.entity.ts";

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export class AthMovilAdapter implements PaymentGateway {
  constructor(private readonly configRepo: PaymentMethodsConfigRepo) {}

  async cobrar(order: OrderState, _metodo: string): Promise<Result<string, PaymentError>> {
    if (order.totalAmount < MIN_MONTO) return err({ kind: "cobro_fallido", cause: "monto_debajo_minimo" });

    const cfg = await this.configRepo.obtenerDecifrado(order.tenantId, "ath_movil");
    const hasSandbox = Boolean(getEnv("ATH_MOVIL_SANDBOX_PUBLIC_TOKEN") && getEnv("ATH_MOVIL_SANDBOX_PRIVATE_TOKEN"));

    if (!cfg.ok) {
      if (hasSandbox) return ok(this.generarRef());
      const cause = cfg.error.kind === "not_found" ? "no_credenciales_sandbox" : "sin_configuracion_tenant";
      return err({ kind: "cobro_fallido", cause });
    }
    const secrets = cfg.value;
    if (!secrets["publicToken"] || !secrets["privateToken"]) {
      return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    }
    return ok(this.generarRef());
  }

  async reembolsar(_payment: PaymentState): Promise<Result<void, PaymentError>> {
    return err({ kind: "reembolso_fallido", cause: "no_implementado_sprint3" });
  }

  private generarRef(): string {
    return "ath_" + crypto.randomUUID();
  }
}