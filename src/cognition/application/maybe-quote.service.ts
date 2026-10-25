/**
 * HUB by Raisen — P2: al detectar intencion de compra, el agente propone una COTIZACION (lee catalogo SKU +
 * el mensaje). Una por conversacion (dedup). NO envia: va a FIRMA del operador. Fire-and-forget. C4 <=75.
 */
import type { AutodraftEvent } from "./maybe-autodraft.service.ts";
import type { QuoteProposalProducer } from "./quote-proposal.producer.ts";
import type { CatalogItem, QuoteProposal } from "../domain/quote-proposal.ts";
import type { QuoteConvRef } from "../infrastructure/quote-proposal-persist.ts";

export class MaybeQuoteService {
  constructor(
    private readonly producer: QuoteProposalProducer,
    private readonly leerCatalogo: (tenantId: string) => Promise<CatalogItem[]>,
    private readonly hayPendiente: (conversationId: string) => Promise<boolean>,
    private readonly persistir: (ref: QuoteConvRef, p: QuoteProposal) => Promise<void>,
  ) {}

  async ejecutar(ev: AutodraftEvent, opportunity: boolean): Promise<void> {
    try {
      if (!opportunity || !ev.conversationId || !ev.contactId) return;
      if (await this.hayPendiente(String(ev.conversationId))) return; // ya hay cotizacion pendiente de firma
      const catalogo = await this.leerCatalogo(ev.tenantId);
      if (catalogo.length === 0) return;
      const prop = await this.producer.producir([{ from: "cliente" as const, text: ev.content }], catalogo, ev.contactName ?? "");
      if (!prop.ok || !prop.value.worth) { console.error(`[quote] no-worth conv=${ev.conversationId}`); return; }
      await this.persistir({ tenantId: ev.tenantId, conversationId: String(ev.conversationId), contactId: String(ev.contactId), to: ev.from, channel: ev.channel }, prop.value);
      console.error(`[quote] propuesta conv=${ev.conversationId} lineas=${prop.value.lines.length}`);
    } catch (e) { console.error(`[quote] ERROR`, e instanceof Error ? e.message : e); }
  }
}
