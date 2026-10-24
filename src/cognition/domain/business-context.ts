/**
 * HUB by Raisen — Contexto del negocio (dominio puro): shape + completitud (verde > 70%). Los `facts`
 * en lenguaje natural viven en business-facts.ts (reusado por el chat de Victor). A2: cero imports
 * externos. C4 <=75. 23 "preguntas": 13 base + 9 de la Lista A (incl. P6 Reglas) + hasProducts derivado.
 */
export interface BusinessContext {
  readonly industry?: string | undefined;
  readonly brandServices?: string | undefined;
  readonly targetAudience?: string | undefined;
  readonly brandTone?: string | undefined;
  readonly brandMission?: string | undefined;
  readonly operationHours?: string | undefined;
  readonly responseSla?: string | undefined;
  readonly businessWhat?: string | undefined;
  readonly differentiator?: string | undefined;
  readonly customInstructions?: string | undefined;
  readonly policies?: string | undefined;
  readonly mainGoal?: string | undefined;
  readonly competitors?: string | undefined;
  readonly brandPromise?: string | undefined;       // A1
  readonly neverSay?: string | undefined;            // A2
  readonly highValueCases?: string | undefined;      // A3
  readonly quarterGoals?: string | undefined;        // A4
  readonly routingCriteria?: string | undefined;     // A5 (P6)
  readonly escalationTriggers?: string | undefined;  // A6 (P6)
  readonly highRiskCases?: string | undefined;       // A7 (P6)
  readonly neverAutomate?: string | undefined;       // A8 (P6)
  readonly doubtThreshold?: string | undefined;      // A9 (P6)
  readonly faq?: string | undefined;                 // FAQ del negocio (B5)
  readonly hasProducts?: boolean | undefined;        // derivado: items > 0
}

export const CONTEXT_KEYS = [
  "businessWhat", "industry", "brandServices", "targetAudience", "differentiator",
  "brandTone", "brandMission", "brandPromise", "neverSay", "policies",
  "faq", "operationHours", "responseSla", "mainGoal", "quarterGoals", "highValueCases",
  "competitors", "routingCriteria", "escalationTriggers", "highRiskCases",
  "neverAutomate", "doubtThreshold", "customInstructions", "hasProducts",
] as const;
export type ContextKey = typeof CONTEXT_KEYS[number];

export const GREEN_THRESHOLD = 0.70; // verde solo si > 70% de las preguntas respondidas

export function isFilled(c: BusinessContext, k: ContextKey): boolean {
  if (k === "hasProducts") return c.hasProducts === true;
  const v = c[k];
  return typeof v === "string" && v.trim().length > 0;
}

export interface Completeness { readonly filled: number; readonly total: number; readonly percent: number; readonly green: boolean; }

export function completeness(c: BusinessContext): Completeness {
  const total = CONTEXT_KEYS.length;
  const filled = CONTEXT_KEYS.filter((k) => isFilled(c, k)).length;
  return { filled, total, percent: Math.round((filled / total) * 100), green: filled / total > GREEN_THRESHOLD };
}
