/**
 * HUB by Raisen — Handlers registry (Slide 4.1). Map nombre -> handler | null.
 * 9 pendientes = null (Slide 4.2). Self-check: 10 claves sync con CORE_TOOL_SPECS. C4 ≤75.
 */
import type { ToolHandler } from "./tool-executor.ts";
import { CORE_TOOL_SPECS } from "../domain/tool.registry.core.ts";
import { handlerCommerceQuoteCreate } from "./handlers/tool.commerce.quote-create.ts";

export const TOOL_HANDLERS: Readonly<Record<string, ToolHandler | null>> = Object.freeze({
  "cerebro.retrieve":                    null,
  "nucleo.customer.summary":             null,
  "omega.brand_voice.get":               null,
  "commerce.quote.create":               handlerCommerceQuoteCreate,
  "commerce.pay.generate_link":          null,
  "whatsapp.catalog.set_item":           null,
  "omega.content.request":               null,
  "omega.campaign.create":               null,
  "nucleo.finance.monthly_close":        null,
  "nucleo.accounting.ingest_transaction": null,
});

const total = Object.keys(TOOL_HANDLERS).length;
if (total !== 10) throw new Error(`handlers.registry: esperado 10, got ${total}`);

for (const spec of CORE_TOOL_SPECS) {
  if (!(spec.nombre in TOOL_HANDLERS)) throw new Error(`handler faltante para ${spec.nombre}`);
}