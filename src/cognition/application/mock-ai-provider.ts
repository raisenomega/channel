/**
 * HUB by Raisen — MockAIProvider (placeholder P1, BC Cognition).
 * Proveedor IA simulado para desarrollo y testing sin API key real.
 *
 * Reemplazar por AIProvider real (Claude/DeepSeek/Qwen) mediante
 * AIProviderRegistry cuando se disponga de credenciales.
 *
 * Comportamiento:
 *  - Respuestas deterministicas por palabras clave del input.
 *  - Simula latencia 0ms y costo 0. NO hace llamadas HTTP externas.
 *
 * C4: < 75 lineas. Pattern Result<T, E>. Sin any.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { AIProvider, AICompletionParams, AICompletionResult, AIError } from "../domain/ai-provider.ts";

export class MockAIProvider implements AIProvider {
  readonly provider = "deepseek" as const;

  async completar(
    params: AICompletionParams,
  ): Promise<Result<AICompletionResult, AIError>> {
    const userMsg = params.messages.find((m) => m.role === "user");
    const input = userMsg?.content ?? "";
    const response = this.#respuestaSimulada(input);

    return ok(Object.freeze({
      response,
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs: 0,
      costUsd: 0,
      model: "mock-ai/v0",
    }));
  }

  async ping(): Promise<Result<boolean, AIError>> {
    return ok(true);
  }

  #respuestaSimulada(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes("precio") || lower.includes("quote") || lower.includes("cotiz")) {
      return "Claro, puedo ayudarte con una cotización. ¿Qué productos o servicios necesitas?";
    }
    if (lower.includes("pago") || lower.includes("pagar") || lower.includes("payment")) {
      return "Entiendo que necesitas realizar un pago. Prepara el enlace de pago para ti.";
    }
    if (lower.includes("cliente") || lower.includes("sale") || lower.includes("venta")) {
      return "¿Me confirmas los datos del cliente para proceder con la venta?";
    }
    if (lower.includes("mesa") || lower.includes("table") || lower.includes("reserv")) {
      return "Con gusto te ayudo a reservar. ¿Qué día, hora y cuántas personas serán?";
    }
    if (lower.includes("estado") || lower.includes("tracking") || lower.includes("seguim")) {
      return "Déjame consultar el estado de tu pedido. Un momento por favor.";
    }
    if (lower.includes("cita") || lower.includes("agendar") || lower.includes("appointment")) {
      return "Con gusto te ayudo a agendar una cita. ¿Qué servicio y qué día prefieres?";
    }
    if (lower.includes("gracias") || lower.includes("thank")) {
      return "¡De nada! Si necesitas algo más, aquí estoy.";
    }
    return `Entiendo tu consulta: «${input}». Déjame analizarla y te respondo a la brevedad.`;
  }
}