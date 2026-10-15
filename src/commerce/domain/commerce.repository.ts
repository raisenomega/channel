import { Result } from "../../shared/domain/result.ts";
import { QuoteId, OrderId, PaymentId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { QuoteState } from "./quote.entity.ts";
import { OrderState } from "./order.entity.ts";
import { PaymentState } from "./payment.entity.ts";

export interface QuoteRepository {
  guardar(quote: QuoteState): Promise<Result<void, RepoError>>;
  buscar(id: QuoteId, tenantId: TenantId): Promise<Result<QuoteState | null, RepoError>>;
}

export interface OrderRepository {
  guardar(order: OrderState): Promise<Result<void, RepoError>>;
  buscar(id: OrderId, tenantId: TenantId): Promise<Result<OrderState | null, RepoError>>;
  buscarPorContacto(contactId: ContactId, tenantId: TenantId): Promise<Result<OrderState[], RepoError>>;
}

export interface PaymentRepository {
  guardar(payment: PaymentState): Promise<Result<void, RepoError>>;
  buscar(id: PaymentId, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>>;
  buscarPorOrder(orderId: OrderId, tenantId: TenantId): Promise<Result<PaymentState[], RepoError>>;
}

export interface PaymentGateway {
  cobrar(order: OrderState, metodo: string): Promise<Result<string, PaymentError>>;
  reembolsar(payment: PaymentState): Promise<Result<void, PaymentError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export type PaymentError =
  | { readonly kind: "cobro_fallido"; readonly cause: string }
  | { readonly kind: "reembolso_fallido"; readonly cause: string };