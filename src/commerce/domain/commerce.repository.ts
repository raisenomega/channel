import { Result } from "../../shared/domain/result.ts";
import { QuoteId, OrderId, PaymentId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { QuoteState } from "./quote.entity.ts";
import { OrderState } from "./order.entity.ts";
import { PaymentState } from "./payment.entity.ts";

export interface QuoteRepository {
  guardar(quote: QuoteState): Promise<Result<void, RepoError>>;
  buscar(id: QuoteId): Promise<Result<QuoteState | null, RepoError>>;
}

export interface OrderRepository {
  guardar(order: OrderState): Promise<Result<void, RepoError>>;
  buscar(id: OrderId): Promise<Result<OrderState | null, RepoError>>;
  buscarPorContacto(contactId: ContactId): Promise<Result<OrderState[], RepoError>>;
}

export interface PaymentRepository {
  guardar(payment: PaymentState): Promise<Result<void, RepoError>>;
  buscar(id: PaymentId): Promise<Result<PaymentState | null, RepoError>>;
  buscarPorOrder(orderId: OrderId): Promise<Result<PaymentState[], RepoError>>;
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