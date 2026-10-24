/**
 * HUB by Raisen — Clasificador de intención (proactivo): decide QUÉ agente responde y si hay OPORTUNIDAD
 * (venta/membresía) en el mensaje del cliente. Una llamada barata (haiku). Si falla, cae a thao/sin-oportunidad
 * (nunca bloquea). C4 <=75. Sin any.
 */
import type { AIProvider } from "../domain/ai-provider.ts";

export interface IntentResult { readonly persona: string; readonly opportunity: boolean; readonly kind: string; readonly confidence: number; }

const AGENTES = new Set(["zahra", "thao", "iris", "eco", "angel", "kelsy"]);
const FALLBACK: IntentResult = { persona: "thao", opportunity: false, kind: "otro", confidence: 0 };

const SYS = [
  "Clasifica el mensaje ENTRANTE de un cliente. Responde SOLO un JSON, sin texto extra:",
  '{"persona":"zahra|thao|angel|eco|kelsy","opportunity":true|false,"kind":"venta|membresia|soporte|queja|feedback|otro","confidence":0-10}',
  "Reglas: zahra = intencion de compra, cotizar, precio, o encaje de membresia; angel = queja/molestia/riesgo;",
  "eco = da feedback/opinion; kelsy = oportunidad estrategica (recompra/win-back); thao = pregunta rutinaria.",
  "opportunity = true SOLO si hay intencion real de compra o encaje de membresia. confidence 0-10 = que tan seguro estas de responder BIEN y sin riesgo.",
].join(" ");

export class IntentClassifier {
  constructor(private readonly provider: AIProvider) {}

  async clasificar(message: string): Promise<IntentResult> {
    const r = await this.provider.completar({ systemPrompt: SYS, messages: [{ role: "user", content: message }], tools: null, maxTokens: 120, tier: "haiku" });
    if (!r.ok) return FALLBACK;
    try {
      const raw = r.value.response.replace(/```json|```/g, "").trim();
      const j = JSON.parse(raw) as Partial<IntentResult>;
      const persona = typeof j.persona === "string" && AGENTES.has(j.persona) ? j.persona : "thao";
      const confidence = typeof j.confidence === "number" ? Math.max(0, Math.min(10, j.confidence)) : 0;
      return { persona, opportunity: j.opportunity === true, kind: typeof j.kind === "string" ? j.kind : "otro", confidence };
    } catch { return FALLBACK; }
  }
}
