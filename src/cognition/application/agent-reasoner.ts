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
import { TOOL_REGISTRY } from "../domain/tool.registry.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import type { AgentContext } from "./agent-context.ts";

export type AgentReasoningError = { readonly kind: "llm_failure"; readonly cause: string };

export interface AgentReasoningResult {
  readonly response: string;
  readonly action: AgentAction;
  readonly model: string;
  readonly costUsd: number;
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
    const tools = Object.values(TOOL_REGISTRY).map((t) => `- ${t.name}: ${t.description}`);
    const knowledge = context.knowledge.map((k) => k.knowledge).join(" | ") || "(sin knowledge)";

    const systemPrompt = [
      `Eres el agente IA de HUB by Raisen. Canal: ${channel}.`,
      `Brand Voice: ${context.brandVoice}`,
      `Catalogo: ${context.catalogContext}`,
      `Knowledge relevante: ${knowledge}`,
      context.contactProfile ? `Contacto: ${context.contactProfile}. Personaliza el saludo: nuevo=bienvenida calida; recurrente=reconoce que ya hablaron; VIP=trato prioritario.` : "",
      `Tools disponibles: ${tools.join(" ")}`,
      "Reglas: nunca mentir sobre ser humano; no cobrar sin confirmacion;",
      "escalar ante queja, urgencia medica o riesgo legal.",
    ].filter(Boolean).join("\n");

    const llm = await this.provider.completar({
      systemPrompt,
      messages: [{ role: "user" as const, content: message.content }],
      tools: null,
      maxTokens: 2048,
      temperature: 0.7,
    });
    if (!llm.ok) return err({ kind: "llm_failure", cause: llm.error.kind });

    return ok(Object.freeze({
      response: llm.value.response,
      action: Object.freeze({ kind: "responder" as const, text: llm.value.response }),
      model: llm.value.model,
      costUsd: llm.value.costUsd,
    }));
  }
}