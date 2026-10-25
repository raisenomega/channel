/**
 * HUB by Raisen — P2: al detectar intencion de compra/cotizar, el agente propone una COTIZACION leyendo el
 * HILO (no solo el mensaje) + el catalogo SKU. Dispara con opportunity O palabras de cotizar (atrapa
 * follow-ups tipo "hazme una nueva con 4"). Una por conversacion (dedup). NO envia: va a FIRMA. C4 <=75.
 */
import type { AutodraftEvent } from "./maybe-autodraft.service.ts";
import type { QuoteProposalProducer } from "./quote-proposal.producer.ts";
import type { ThreadMsg } from "./closing-draft.producer.ts";
import type { CatalogItem, QuoteProposal } from "../domain/quote-proposal.ts";
import type { QuoteConvRef } from "../infrastructure/quote-proposal-persist.ts";

const QUOTE_RE = /cotiz|presupuest|precio|cu[aá]nto|cr[eé]a|h[aá]zla|h[aá]gala|comprar|orden|quiero/i;

export class MaybeQuoteService {
  constructor(
    private readonly producer: QuoteProposalProducer,
    private readonly leerCatalogo: (tenantId: string) => Promise<CatalogItem[]>,
    private readonly hayPendiente: (conversationId: string) => Promise<boolean>,
    private readonly persistir: (ref: QuoteConvRef, p: QuoteProposal) => Promise<void>,
    private readonly leerHilo: (conversationId: string) => Promise<readonly ThreadMsg[]>,
  ) {}

  async ejecutar(ev: AutodraftEvent, opportunity: boolean): Promise<void> {
    try {
      if (!ev.conversationId || !ev.contactId) return;
      if (!opportunity && !QUOTE_RE.test(ev.content)) return; // compra detectada O pide cotizar (follow-ups)
      if (await this.hayPendiente(String(ev.conversationId))) return; // ya hay una pendiente de firma
      const catalogo = await this.leerCatalogo(ev.tenantId);
      if (catalogo.length === 0) return;
      const hilo = await this.leerHilo(String(ev.conversationId));
      const thread = hilo.length ? hilo : [{ from: "cliente" as const, text: ev.content }];
      const prop = await this.producer.producir(thread, catalogo, ev.contactName ?? "");
      if (!prop.ok || !prop.value.worth) { console.error(`[quote] no-worth conv=${ev.conversationId}`); return; }
      await this.persistir({ tenantId: ev.tenantId, conversationId: String(ev.conversationId), contactId: String(ev.contactId), to: ev.from, channel: ev.channel }, prop.value);
      console.error(`[quote] propuesta conv=${ev.conversationId} lineas=${prop.value.lines.length}`);
    } catch (e) { console.error(`[quote] ERROR`, e instanceof Error ? e.message : e); }
  }
}
