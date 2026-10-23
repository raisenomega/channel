/**
 * HUB by Raisen — Chat REAL de VICTOR: el dueno le habla para planificar; Victor responde con su
 * persona (PERSONA_VICTOR) via el provider IA (Anthropic). No es el cliente final -> sin AI disclosure.
 * `facts` = contexto de CEREBRO (vacio si no hay). C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import { PERSONA_VICTOR } from "../domain/personas/persona.victor.ts";

export type VictorChatError = { readonly kind: "llm_failure"; readonly cause: string };

function systemPrompt(facts: readonly string[]): string {
  const p = PERSONA_VICTOR;
  const ctx = facts.length ? `\nContexto del cliente (CEREBRO): ${facts.join(" | ")}` : "";
  return [
    `Eres ${p.nombre_display}, ${p.rol}.`,
    `Mision: ${p.mision}`,
    "Hablas con el DUENO del negocio (no un cliente final): le ayudas a planificar y decidir como un CEO.",
    `Principios: ${p.principios_literales.P1_VERDAD_BRUTAL} ${p.principios_literales.P2_REPUTACION_CLIENTE_FINAL}`,
    "Responde claro, breve y accionable, en espanol. Si no sabes un dato, dilo; nunca lo inventes.",
    ctx,
  ].join("\n");
}

export class VictorChatHandler {
  async ejecutar(provider: AIProvider, message: string, facts: readonly string[]): Promise<Result<{ reply: string; model: string }, VictorChatError>> {
    const sp = systemPrompt(facts);
    const r = await provider.completar({
      systemPrompt: sp,
      messages: [{ role: "user", content: message }],
      tools: null, maxTokens: 1024, temperature: 0.6, tier: "sonnet",
    });
    if (!r.ok) return err({ kind: "llm_failure", cause: (r.error as { cause?: string }).cause ?? r.error.kind });
    const reply = r.value.response.trim();
    if (!reply) return err({ kind: "llm_failure", cause: "respuesta_vacia" });
    return ok({ reply, model: r.value.model });
  }
}
