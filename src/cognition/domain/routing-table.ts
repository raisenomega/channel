/**
 * HUB by Raisen — Routing por tier (I2). No versiones fijas.
 * El adapter resuelve el modelo concreto dinamicamente por tier.
 * Añadido: PERSONA_ROUTING para las 7 personas HUB (Slide 4.0).
 * C4 ≤75 lineas.
 */
export type ModelTier = "haiku" | "sonnet" | "opus";

export const ROUTING = Object.freeze({
  classification: "haiku" as const,
  short_response: "haiku" as const,
  conversation: "sonnet" as const,
  draft_response: "sonnet" as const,
  reasoning: "sonnet" as const,
  escalation: "opus" as const,
  critical_action: "opus" as const,
});

/** Tier por persona HUB (del §10.4 del doc v2.0). */
export const PERSONA_ROUTING: Readonly<Record<string, ModelTier>> = Object.freeze({
  victor: "opus",
  angel: "opus",
  kelsy: "sonnet",
  iris: "sonnet",
  zahra: "sonnet",
  thao: "sonnet",
  eco: "sonnet",
});

// Tier de la RESPUESTA al cliente por persona (flujo generate-draft): rutina/feedback/patrones = haiku
// (barato ~3x), venta/riesgo/estrategia = sonnet (default). NUNCA opus en runtime (Opus = 0 uso real).
export const RESPONSE_TIER: Readonly<Record<string, ModelTier>> = Object.freeze({
  thao: "haiku", eco: "haiku", iris: "haiku",
});

export type Task = keyof typeof ROUTING;

export const DEGRADATION_CHAIN: Readonly<Record<ModelTier, readonly ModelTier[]>> = Object.freeze({
  opus:   Object.freeze(["opus", "sonnet", "haiku"] as const),
  sonnet: Object.freeze(["sonnet", "haiku"] as const),
  haiku:  Object.freeze(["haiku"] as const),
});