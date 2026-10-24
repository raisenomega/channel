/**
 * HUB by Raisen — Contexto del negocio (dominio puro). Define los campos que los agentes necesitan
 * saber, calcula el % de completitud (verde > 70%) y arma los `facts` que recibe cada agente.
 * Cero imports externos (A2). C4 <=75. Fuente unica para la ruta y para el chat de Victor.
 */
export interface BusinessContext {
  readonly industry?: string | undefined;        // de tenants
  readonly brandServices?: string | undefined;   // de tenants.brand_services
  readonly targetAudience?: string | undefined;  // de tenants.brand_target_audience
  readonly brandTone?: string | undefined;       // de tenants.brand_tone
  readonly brandMission?: string | undefined;    // de tenants.brand_mission
  readonly operationHours?: string | undefined;  // de tenants.operation_hours
  readonly responseSla?: string | undefined;     // de tenants.expected_response_sla
  readonly businessWhat?: string | undefined;    // de tenant_context
  readonly differentiator?: string | undefined;
  readonly customInstructions?: string | undefined;
  readonly policies?: string | undefined;
  readonly mainGoal?: string | undefined;
  readonly competitors?: string | undefined;
  readonly hasProducts?: boolean | undefined;    // derivado: items > 0
}

export const CONTEXT_KEYS = [
  "businessWhat", "industry", "brandServices", "targetAudience", "differentiator",
  "brandTone", "brandMission", "policies", "mainGoal", "competitors",
  "operationHours", "responseSla", "customInstructions", "hasProducts",
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

/** Facts en lenguaje natural que recibe cada agente. Omite vacios (vacio honesto). */
export function buildFacts(c: BusinessContext): readonly string[] {
  const f: string[] = [];
  const add = (label: string, v?: string) => { if (v && v.trim()) f.push(`${label}: ${v.trim()}`); };
  add("Que hace el negocio", c.businessWhat);
  add("Industria", c.industry);
  add("Productos/servicios", c.brandServices);
  add("Audiencia objetivo", c.targetAudience);
  add("Diferenciador", c.differentiator);
  add("Tono de marca", c.brandTone);
  add("Mision", c.brandMission);
  add("Politicas", c.policies);
  add("Objetivo actual", c.mainGoal);
  add("Competidores", c.competitors);
  add("Horario de operacion", c.operationHours);
  add("Instrucciones especiales", c.customInstructions);
  return Object.freeze(f);
}
