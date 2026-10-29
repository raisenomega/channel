/**
 * HUB by Raisen — Razonador del agente (BC Cognition).
 * Paso 4 del ciclo: ejecuta el LLM inyectando contexto (voice, catalogo,
 * knowledge y tools) y normaliza la salida a un AgentAction.
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { sanitizarProsa, detectarMarcador, type Marcador } from "../domain/prose-sanitizer.ts";
import { construirPromptEstatico } from "./agent-prompt.ts";
import { bajarImagenBase64 } from "../infrastructure/media-fetch.ts";
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
  readonly marcador: Marcador; // ESCALAR (cliente) o CONSULTA (duda de negocio); saneado del texto al cliente
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
    const historial = context.history.length
      ? "HISTORIAL del hilo (usa estos datos; NUNCA vuelvas a pedir algo que el cliente YA dio):\n" + context.history.map((m) => `${m.from === "cliente" ? "Cliente" : "Tu"}: ${m.text}`).join("\n")
      : "(primer mensaje del hilo: puedes saludar una vez)";
    const estatico = construirPromptEstatico(channel, context);
    const mem = context.memoria?.length ? "MEMORIA del cliente (CEREBRO, de conversaciones/plataformas previas; usala para no re-preguntar ni contradecirte, no la cites literal):\n" + context.memoria.join("\n") + "\n\n" : "";
    const img = context.mediaUrl ? await bajarImagenBase64(context.mediaUrl, context.mediaMime ?? "") : null; // vision: el agente VE la foto

    const llm = await this.provider.completar({
      systemPrompt: mem + historial, // dinamico (memoria CEREBRO + historial del hilo)
      cachedSystem: estatico,  // ESTATICO -> prompt caching (~90% mas barato en relecturas)
      messages: [{ role: "user" as const, content: message.content }],
      images: img ? [img] : undefined,
      tools: null,
      maxTokens: 2048,
      temperature: 0.7,
      tier: context.tier ?? "sonnet",
    });
    if (!llm.ok) return err({ kind: "llm_failure", cause: llm.error.kind });
    const texto = sanitizarProsa(llm.value.response); // tags de tool + prosa interna (nota interna/escalar_a_humano) NUNCA al cliente

    return ok(Object.freeze({
      response: texto,
      action: Object.freeze({ kind: "responder" as const, text: texto }),
      model: llm.value.model,
      costUsd: llm.value.costUsd,
      tokens: { input: llm.value.tokensInput, output: llm.value.tokensOutput, cacheRead: llm.value.cacheRead ?? 0, cacheCreation: llm.value.cacheCreation ?? 0 },
      marcador: detectarMarcador(llm.value.response),
    }));
  }
}