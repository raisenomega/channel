/**
 * HUB by Raisen — Routing por tier (I2). No versiones fijas.
 * El adapter resuelve el modelo concreto dinamicamente por tier.
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

export type Task = keyof typeof ROUTING;

export const DEGRADATION_CHAIN: Readonly<Record<ModelTier, readonly ModelTier[]>> = Object.freeze({
  opus:   Object.freeze(["opus", "sonnet", "haiku"] as const),
  sonnet: Object.freeze(["sonnet", "haiku"] as const),
  haiku:  Object.freeze(["haiku"] as const),
});