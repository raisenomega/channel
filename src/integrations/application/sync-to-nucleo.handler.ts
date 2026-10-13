import { Result } from "../../shared/domain/result.ts";
import { ContactId, TenantId, QuoteId } from "../../shared/domain/ids.ts";
import { NUCLEOGateway, IntegracionError } from "../domain/integration.gateways.ts";

export class SyncToNucleoHandler {
  constructor(private readonly nucleo: NUCLEOGateway) {}

  async syncContact(tenantId: TenantId, contactId: ContactId): Promise<Result<void, IntegracionError>> {
    return this.nucleo.syncContact(tenantId, contactId);
  }

  async crearFactura(tenantId: TenantId, quoteId: QuoteId): Promise<Result<string, IntegracionError>> {
    return this.nucleo.crearFactura(tenantId, quoteId);
  }
}