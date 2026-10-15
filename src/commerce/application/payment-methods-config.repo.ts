/**
 * HUB by Raisen — Puerto del repositorio de configuracion de metodos de pago.
 * obtenerDecifrado usa RPC decrypt_secret para leer credenciales.
 * C4 ≤50 lineas.
 */
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { RepoError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigState } from "../domain/payment-methods-config.entity.ts";

export interface PaymentMethodsConfigRepo {
  obtener(tenantId: TenantId, provider: string): Promise<Result<PaymentMethodsConfigState | null, RepoError>>;
  obtenerDecifrado(tenantId: TenantId, provider: string): Promise<Result<Record<string, string>, RepoError>>;
  findByStripeAccountId(stripeAccountId: string): Promise<Result<PaymentMethodsConfigState | null, RepoError>>;
  guardar(config: PaymentMethodsConfigState): Promise<Result<void, RepoError>>;
}