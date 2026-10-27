/**
 * HUB by Raisen — P2: el agente propone una COTIZACION desde el catalogo SKU leyendo el hilo. Devuelve lineas
 * + encabezado honesto (conclusion, senal, % acierto). NO crea la cotizacion: va a FIRMA del operador. C4<=75.
 */
import { err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import type { ThreadMsg } from "./closing-draft.producer.ts";
import { parseQuoteProposal, type QuoteProposal, type CatalogItem } from "../domain/quote-proposal.ts";

const PROMPT = [
  "Eres un asistente de ventas. Lees una conversacion y el CATALOGO de productos/servicios del negocio.",
  "Si el cliente mostro intencion CONCRETA de comprar algo del catalogo, propone las LINEAS de una cotizacion.",
  "Honesto: si no hay intencion concreta o no calza ningun item del catalogo -> worth=false, lines=[].",
  "Usa SOLO items del catalogo (su nombre exacto como description, su precio exacto como unitPrice). NO inventes",
  "precios ni productos. quantity = la que pida el cliente (default 1).",
  "FICHA: cada item trae su DESCRIPCION completa ('Incluye: ...') y su codigo [SKU]. LEELA ENTERA, byte a byte:",
  "es tu fuente primaria para explicar al cliente que contiene ese SKU/precio. NO inventes ni omitas lo que incluye;",
  "si el cliente pregunta que trae, responde con lo que dice la descripcion del item, nada mas.",
  "STOCK: si un item muestra [disponibles: N], NUNCA cotices una cantidad mayor a N; si disponibles: 0, NO lo",
  "ofrezcas (sin stock). Los items sin [disponibles] no controlan stock: cotiza normal.",
  "Responde SOLO JSON valido (sin texto extra) con este shape exacto:",
  '{"worth":bool,"lines":[{"description":string,"quantity":number,"unitPrice":number}],"conclusion":string,"identified":string,"confidence":number}',
  "conclusion=por que propones la cotizacion. identified=la senal de compra del cliente. confidence=0-100 honesto.",
].join("\n");

export class QuoteProposalProducer {
  constructor(private readonly ai: AIProvider) {}

  async producir(thread: readonly ThreadMsg[], catalogo: readonly CatalogItem[], contexto: string): Promise<Result<QuoteProposal, { readonly kind: string }>> {
    if (catalogo.length === 0) return err({ kind: "catalogo_vacio" });
    const hilo = thread.map((m) => `${m.from}: ${m.text}`).join("\n");
    const cat = catalogo.map((i) => {
      const sku = i.sku ? `[${i.sku}] ` : "";
      const disp = i.trackInventory ? ` [disponibles: ${i.stock ?? 0}]` : "";
      const inc = i.description && i.description.trim() ? `\n    Incluye: ${i.description.trim()}` : "";
      return `- ${sku}${i.name} ($${i.unitPrice})${disp}${inc}`;
    }).join("\n");
    const sys = `${PROMPT}\n\nContexto del negocio: ${contexto}\n\nCATALOGO:\n${cat}`;
    const llm = await this.ai.completar({ systemPrompt: sys, messages: [{ role: "user", content: hilo }], tools: null, maxTokens: 900, tier: "sonnet" });
    if (!llm.ok) return err({ kind: "llm_failure" });
    return parseQuoteProposal(llm.value.response);
  }
}
