import { Result, err, ok } from "../../shared/domain/result.ts";
import { QuoteId, ContactId, TenantId } from "../../shared/domain/ids.ts";
import { QuoteState, QuoteError, QuoteLineItem, CreateByType, crearQuote } from "../domain/quote.entity.ts";
import { QuoteRepository, RepoError } from "../domain/commerce.repository.ts";

export interface CreateQuoteCommand {
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly items: readonly QuoteLineItem[];
  readonly createdByType?: CreateByType;
  readonly mode?: "lite" | "nucleo_synced";
}

export type CreateQuoteError = QuoteError | RepoError;

export class CreateQuoteHandler {
  constructor(private readonly quoteRepo: QuoteRepository) {}

  async ejecutar(cmd: CreateQuoteCommand): Promise<Result<QuoteId, CreateQuoteError>> {
    const result = crearQuote(cmd.contactId, cmd.tenantId, cmd.items, cmd.createdByType, cmd.mode);
    if (!result.ok) return err(result.error);
    const guardado = await this.quoteRepo.guardar(result.value);
    if (!guardado.ok) return err(guardado.error);
    return ok(result.value.id);
  }
}