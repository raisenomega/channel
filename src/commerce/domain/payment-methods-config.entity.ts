/**
 * HUB by Raisen — Configuración de métodos de pago por tenant.
 * Credenciales cifradas en DB (secrets_encrypted), never en env.
 * Para stripe: config guarda stripe_account_id (no secreto) + connect_type.
 * C4 ≤75 lineas.
 */
import type { TenantId } from "../../shared/domain/ids.ts";

export type PaymentProvider = "ath_movil" | "stripe";
export type PaymentEnv = "sandbox" | "prod";

export interface PaymentMethodsConfigState {
  readonly tenantId: TenantId;
  readonly provider: PaymentProvider;
  readonly env: PaymentEnv;
  readonly config: Readonly<Record<string, unknown>>;
  readonly secretsEncrypted: Readonly<Record<string, string>>;
  readonly isActive: boolean;
}