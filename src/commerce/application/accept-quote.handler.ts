import { Result, err, ok } from "../../shared/domain/result.ts";
import { QuoteId, OrderId } from "../../shared/domain/ids.ts";
import { aceptarQuote } from "../domain/quote.entity.ts";
import { crearOrder, OrderError } from "../domain/order.entity.ts";
import { QuoteRepository, OrderRepository, RepoError } from "../domain/commerce.repository.ts";

export interface AcceptQuoteCommand {
  readonly quoteId: QuoteId;
}

export type AcceptQuoteError =
  | RepoError
  | { readonly kind: "cotizacion_no_encontrada" }
  | OrderError;

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
    const guardarQuote = await this.quoteRepo.guardar(quoteAceptada);
    if (!guardarQuote.ok) return err(guardarQuote.error);

    const orderResult = crearOrder(quote.contactId, quote.tenantId, quote.totalAmount, quote.id);
    if (!orderResult.ok) return err(orderResult.error);

    const guardarOrder = await this.orderRepo.guardar(orderResult.value);
    if (!guardarOrder.ok) return err(guardarOrder.error);
    return ok(orderResult.value.id);
  }
}