/**
 * HUB by Raisen — Chat REAL de VICTOR: el dueno le habla para planificar; Victor responde con su
 * persona (PERSONA_VICTOR) via el provider IA (Anthropic). No es el cliente final -> sin AI disclosure.
 * `facts` = contexto de CEREBRO (vacio si no hay). C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { AIProvider, AIMessage } from "../domain/ai-provider.ts";
import { PERSONA_VICTOR } from "../domain/personas/persona.victor.ts";
import { buildAgentDirectory } from "../domain/agent-directory.ts";
import { buildCapabilitiesBlock } from "../domain/agent-capabilities.ts";

export type VictorChatError = { readonly kind: "llm_failure"; readonly cause: string };

function staticPrompt(): string { // ESTATICO -> se cachea (persona/directorio/capacidades no cambian por turno)
  const p = PERSONA_VICTOR;
  return [
    `Eres ${p.nombre_display}, ${p.rol}.`,
    `Mision: ${p.mision}`,
    "Hablas con el DUENO del negocio (no un cliente final): le ayudas a planificar y decidir como un CEO.",
    `Principios: ${p.principios_literales.P1_VERDAD_BRUTAL} ${p.principios_literales.P2_REPUTACION_CLIENTE_FINAL}`,
    buildAgentDirectory(),
    buildCapabilitiesBlock(),
    "Para datos de PRODUCTOS (que incluye, precio, cantidad disponible, lote, vencimiento) tu FUENTE PRIMARIA es",
    "el Catalogo/SKU del contexto: lee cada ficha COMPLETA byte a byte y cita de ahi, no de descripciones sueltas",
    "del contexto general. Si el dueno pregunta por un producto, responde con lo que dice su ficha, exacto.",
    "Responde claro, breve y accionable, en espanol. Si no sabes un dato, dilo; nunca lo inventes.",
  ].join("\n");
}

function ctxPrompt(facts: readonly string[]): string { // dinamico (cap 4k: evita el 502/lentitud)
  return facts.length
    ? `Contexto del negocio (de la pagina Contexto): ${facts.join(" | ")}` // LEY HUB: contexto COMPLETO (sin cap); caching + aviso amable en 502 como red
    : "Contexto del negocio: aun vacio. Pide al dueno que llene la pagina Contexto; no inventes datos.";
}

export class VictorChatHandler {
  async ejecutar(provider: AIProvider, message: string, facts: readonly string[], history: readonly AIMessage[] = []): Promise<Result<{ reply: string; model: string }, VictorChatError>> {
    const r = await provider.completar({
      systemPrompt: ctxPrompt(facts), // dinamico (el contexto cambia)
      cachedSystem: staticPrompt(),   // ESTATICO -> prompt caching (~90% mas barato en relecturas)
      messages: [...history, { role: "user", content: message }], // hilo completo: Victor recuerda la conversacion previa
      tools: null, maxTokens: 2048, temperature: 0.6, tier: "sonnet", // 2048: respuestas completas (audit de 6 secciones se cortaba en 1024)
    });
    if (!r.ok) return err({ kind: "llm_failure", cause: (r.error as { cause?: string }).cause ?? r.error.kind });
    const reply = r.value.response.trim();
    if (!reply) return err({ kind: "llm_failure", cause: "respuesta_vacia" });
    return ok({ reply, model: r.value.model });
  }
}
