/**
 * HUB by Raisen — Facts del negocio en lenguaje natural (dominio puro). Convierte el contexto en lineas
 * que recibe cada agente (omite vacios: vacio honesto). A2 cero imports externos. C4 <=75.
 */
import { CONTEXT_KEYS, isFilled, type BusinessContext } from "./business-context.ts";

const FACT_LABELS: Record<string, string> = {
  businessWhat: "Que hace el negocio", industry: "Industria", brandServices: "Productos/servicios",
  targetAudience: "Audiencia objetivo", differentiator: "Diferenciador", brandTone: "Tono de marca",
  brandMission: "Mision", brandPromise: "Promesa de marca", neverSay: "Nunca decir/prometer",
  policies: "Politicas", operationHours: "Horario de operacion", responseSla: "Tiempo de respuesta esperado",
  mainGoal: "Objetivo actual", quarterGoals: "Metas del trimestre", highValueCases: "Casos de alto valor",
  competitors: "Competidores", routingCriteria: "Criterios de enrutamiento",
  escalationTriggers: "Escalar directo al humano", highRiskCases: "Casos de alto riesgo",
  neverAutomate: "Nunca automatizar", doubtThreshold: "Umbral de duda", customInstructions: "Instrucciones especiales",
};

export function buildFacts(c: BusinessContext): readonly string[] {
  const vals = c as Record<string, unknown>;
  const out = CONTEXT_KEYS
    .filter((k) => k !== "hasProducts" && isFilled(c, k))
    .map((k) => `${FACT_LABELS[k]}: ${String(vals[k]).trim()}`);
  return Object.freeze(out);
}
