/**
 * HUB by Raisen — Parte B: extrae del HILO los datos que el CLIENTE dio EXPLICITAMENTE sobre si mismo
 * (nombre/telefono/email/direccion/producto). Conservador: NO inventa, NO deduce. Si un dato no fue dado,
 * omite el campo. Modelo barato (haiku). Devuelve {} si falla o no hay nada. C4 <=75. Sin any.
 */
import type { AIProvider } from "../domain/ai-provider.ts";
import type { ThreadMsg } from "./closing-draft.producer.ts";
import { parseExtracted, type ExtractedData } from "../domain/contact-data.ts";

const PROMPT = [
  "Lee el HILO y extrae SOLO los datos que el CLIENTE dio EXPLICITAMENTE sobre si mismo. NO inventes, NO",
  "deduzcas, NO asumas. Si un dato no fue dado por el cliente de forma explicita, OMITE ese campo.",
  "Campos posibles: name (su nombre), phone (telefono), email, address (direccion fisica), product (que",
  "producto o servicio quiere comprar). Responde SOLO JSON valido, incluyendo unicamente los campos dados:",
  '{"name":string,"phone":string,"email":string,"address":string,"product":string}',
].join("\n");

export class ContactDataProducer {
  constructor(private readonly ai: AIProvider) {}

  async extraer(thread: readonly ThreadMsg[]): Promise<ExtractedData> {
    if (thread.length === 0) return {};
    const hilo = thread.map((m) => `${m.from}: ${m.text}`).join("\n");
    const llm = await this.ai.completar({ systemPrompt: PROMPT, messages: [{ role: "user", content: hilo }], tools: null, maxTokens: 400, tier: "haiku" });
    return llm.ok ? parseExtracted(llm.value.response) : {};
  }
}
