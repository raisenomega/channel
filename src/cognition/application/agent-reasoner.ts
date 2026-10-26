/**
 * HUB by Raisen — Razonador del agente (BC Cognition).
 * Paso 4 del ciclo: ejecuta el LLM inyectando contexto (voice, catalogo,
 * knowledge y tools) y normaliza la salida a un AgentAction.
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";
import type { AgentAction } from "../domain/agent-executor.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import type { AgentContext } from "./agent-context.ts";

export type AgentReasoningError = { readonly kind: "llm_failure"; readonly cause: string };

export interface AgentReasoningResult {
  readonly response: string;
  readonly action: AgentAction;
  readonly model: string;
  readonly costUsd: number;
  readonly tokens: { readonly input: number; readonly output: number; readonly cacheRead: number; readonly cacheCreation: number };
}

export class AgentReasoner {
  private readonly provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async razonar(
    message: NormalizedMessage,
    channel: ChannelType,
    context: AgentContext,
  ): Promise<Result<AgentReasoningResult, AgentReasoningError>> {
    const knowledge = context.knowledge.map((k) => k.knowledge).join(" | ") || "(sin knowledge)";

    const historial = context.history.length
      ? "HISTORIAL del hilo (usa estos datos; NUNCA vuelvas a pedir algo que el cliente YA dio):\n" + context.history.map((m) => `${m.from === "cliente" ? "Cliente" : "Tu"}: ${m.text}`).join("\n")
      : "(primer mensaje del hilo: puedes saludar una vez)";
    const estatico = [
      `Eres el agente IA de HUB by Raisen. Canal: ${channel}.`,
      `Brand Voice: ${context.brandVoice}`,
      `Catalogo: ${context.catalogContext}`,
      `Knowledge relevante: ${knowledge}`,
      context.contactProfile ? `Contacto: ${context.contactProfile}. Personaliza el trato (no el saludo): nuevo=bienvenida; recurrente=reconoce que ya hablaron; VIP=trato prioritario.` : "",
      "Estilo: responde BREVE y directo (2-4 frases), sin parrafos largos.",
      "Saluda SOLO si es el primer mensaje del hilo; si ya hay historial, continua sin repetir 'buenos dias'.",
      "Usa los datos del cliente y del historial; continua desde donde quedaron, no reinicies la conversacion.",
      "No uses herramientas, funciones ni etiquetas tipo <invoke>, <function_calls> o XML: responde SOLO texto normal para el cliente. Si hace falta un humano, dilo en palabras.",
      "LEY ABSOLUTA DE DATOS (HUB): para avanzar a una cotizacion/orden DEBES tener nombre, telefono, direccion, email y el detalle del producto/servicio. Si falta ALGUNO, PIDELO primero y NO prometas cotizacion ni digas 'el equipo te contactara'. Nunca inventes acciones que no puedes ejecutar (marcar prioritario, contrato, agendar fecha).",
      "Reglas: nunca mentir sobre ser humano; no cobrar sin confirmacion; escalar ante queja, urgencia medica o riesgo legal.",
    ].filter(Boolean).join("\n");

    const llm = await this.provider.completar({
      systemPrompt: historial, // dinamico (cambia por turno)
      cachedSystem: estatico,  // ESTATICO -> prompt caching (~90% mas barato en relecturas)
      messages: [{ role: "user" as const, content: message.content }],
      tools: null,
      maxTokens: 2048,
      temperature: 0.7,
      tier: context.tier ?? "sonnet",
    });
    if (!llm.ok) return err({ kind: "llm_failure", cause: llm.error.kind });
    const texto = llm.value.response.replace(/<invoke[\s\S]*?<\/invoke>/gi, "").replace(/<\/?(invoke|function_calls|parameter|antml)[^>]*>/gi, "").trim();

    return ok(Object.freeze({
      response: texto,
      action: Object.freeze({ kind: "responder" as const, text: texto }),
      model: llm.value.model,
      costUsd: llm.value.costUsd,
      tokens: { input: llm.value.tokensInput, output: llm.value.tokensOutput, cacheRead: llm.value.cacheRead ?? 0, cacheCreation: llm.value.cacheCreation ?? 0 },
    }));
  }
}