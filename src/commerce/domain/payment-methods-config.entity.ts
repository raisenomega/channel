/**
 * HUB by Raisen — Configuración de métodos de pago por tenant.
 * Credenciales cifradas en DB (secrets_encrypted), nunca en env.
 * C4 ≤75 lineas.
 */
import type { TenantId } from "../../shared/domain/ids.ts";

export type PaymentProvider = "ath_movil" | "stripe";
export type PaymentEnv = "sandbox" | "prod";

export interface PaymentMethodsConfigState {
  readonly tenantId: TenantId;
  readonly provider: PaymentProvider;
  readonly env: PaymentEnv;
  readonly secretsEncrypted: Readonly<Record<string, string>>;
  readonly isActive: boolean;
}