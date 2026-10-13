import { Result, err, ok } from "../../shared/domain/result.ts";
import { QuoteId, OrderId } from "../../shared/domain/ids.ts";
import { aceptarQuote } from "../domain/quote.entity.ts";
import { crearOrder, OrderState } from "../domain/order.entity.ts";
import { QuoteRepository, OrderRepository, RepoError } from "../domain/commerce.repository.ts";

export interface AcceptQuoteCommand {
  readonly quoteId: QuoteId;
}

export type AcceptQuoteError = RepoError | { readonly kind: "cotizacion_no_encontrada" };

export class AcceptQuoteHandler {
  constructor(
    private readonly quoteRepo: QuoteRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async ejecutar(cmd: AcceptQuoteCommand): Promise<Result<OrderId, AcceptQuoteError>> {
    const quoteResult = await this.quoteRepo.buscar(cmd.quoteId);
    if (!quoteResult.ok) return err(quoteResult.error);
    const quote = quoteResult.value;
    if (!quote) return err({ kind: "cotizacion_no_encontrada" });

    const quoteAceptada = aceptarQuote(quote);
    await this.quoteRepo.guardar(quoteAceptada);

    const orderResult = crearOrder(quote.contactId, quote.tenantId, quote.totalAmount, quote.id);
    if (!orderResult.ok) return err(orderResult.error);

    await this.orderRepo.guardar(orderResult.value);
    return ok(orderResult.value.id);
  }
}